 #!/usr/bin/env node

/**
 * One-Click Deploy Script
 * - 环境检查与依赖安装
 * - 前端资源构建到 dist/static
 * - 数据库初始化与索引
 * - 多语言资源验证
 * - 后端服务启动（Node）
 * - 健康检查与失败回滚
 *
 * 用法：
 *   node scripts/one-click-deploy.js --env development
 *   node scripts/one-click-deploy.js --env production
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const cwd = path.resolve(__dirname, '..');
const ENV = (process.argv.join(' ').match(/--env\s+(development|staging|production)/) || [])[1] || process.env.NODE_ENV || 'development';

// Load environment file for production/staging if present
const envFile = ENV === 'production' ? '.env.production' : (ENV === 'staging' ? '.env.staging' : '.env.development');
const envPath = path.join(cwd, envFile);
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').replace('Z', '');
  console.log(`[${ts}] ${msg}`);
}
function warn(msg) { console.warn(`\x1b[33m[WARN]\x1b[0m ${msg}`); }
function error(msg) { console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`); }

function run(cmd, opts = {}) {
  log(`$ ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', cwd, ...opts });
}

function checkPrerequisites() {
  log('检查环境与依赖...');
  // Node & npm
  try { run('node -v'); } catch { throw new Error('Node 未安装'); }
  try { run('npm -v'); } catch { throw new Error('npm 未安装'); }

  // 目录结构
  const requiredDirs = ['static', 'workflows', 'database'];
  requiredDirs.forEach(d => {
    const p = path.join(cwd, d);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  });

  // 必需前端文件
  const requiredFiles = [
    path.join(cwd, 'static', 'styles', 'i18n-ui-standards.js'),
    path.join(cwd, 'static', 'styles', 'i18n-global.css'),
    path.join(cwd, 'static', 'styles', 'ui-standards.css'),
    path.join(cwd, 'static', 'index.html'),
  ];
  const missing = requiredFiles.filter(p => !fs.existsSync(p));
  if (missing.length) {
    throw new Error(`缺少必要的前端文件:\n- ${missing.join('\n- ')}`);
  }
}

function installDependencies() {
  log('安装 Node 依赖...');
  run('npm install');
}

function buildFrontend() {
  log('构建前端资源到 dist/static...');
  process.env.NODE_ENV = ENV === 'production' ? 'production' : 'development';
  run('npm run build');
}

function initDatabase() {
  log('初始化数据库并生成初始统计...');
  try {
    run('node src/init-db.js');
  } catch (e) {
    warn('数据库初始化脚本返回非零，但继续尝试索引');
  }
}

function generateDocsAndIndex() {
  log('生成工作流文档与检索索引...');
  try {
    run('python tools/workflow_documentation_generator.py');
  } catch (e) {
    warn('文档生成失败，继续执行');
  }
  try {
    run('python scripts/generate_search_index.py');
  } catch (e) {
    warn('检索索引生成失败，继续执行');
  }
}

function verifyI18nResources() {
  log('验证多语言资源...');
  const localesDir = path.join(cwd, 'static', 'locales');
  const languages = ['en', 'zh'];
  const missing = [];
  languages.forEach(lang => {
    const p = path.join(localesDir, lang, 'translation.json');
    if (!fs.existsSync(p)) missing.push(p);
  });
  if (missing.length) {
    throw new Error(`缺少多语言资源文件:\n- ${missing.join('\n- ')}`);
  }
}

let serverProc = null;
function startServer() {
  log('启动后端服务...');
  // Prefer PORT from env files; default to 3000 unless explicitly set
  let port = 3000;
  if (process.env.PORT) {
    port = Number(process.env.PORT);
  } else if (ENV === 'production') {
    // If no PORT in env, default to 3000 to match nginx upstream
    port = 3000;
  }
  process.env.PORT = String(port);
  process.env.HOST = process.env.HOST || '0.0.0.0';
  process.env.NODE_ENV = ENV;
  serverProc = spawn('node', ['api/server.js'], { cwd, env: process.env, stdio: 'inherit' });
}

async function healthCheck() {
  log('进行健康检查...');
  const http = require('http');
  const url = `http://127.0.0.1:${process.env.PORT || 3000}/health`;
  const maxAttempts = 30; // 30s
  for (let i = 1; i <= maxAttempts; i++) {
    await new Promise(res => setTimeout(res, 1000));
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          const ok = res.statusCode === 200;
          ok ? resolve(true) : reject(new Error(`HTTP ${res.statusCode}`));
        });
        req.on('error', reject);
        req.end();
      });
      log('健康检查通过');
      return true;
    } catch (e) {
      log(`健康检查重试 ${i}/${maxAttempts} ...`);
    }
  }
  return false;
}

function rollback() {
  warn('执行回滚：终止服务进程，清理临时资源');
  if (serverProc) {
    try { serverProc.kill('SIGINT'); } catch {}
  }
}

async function main() {
  log(`一键部署开始，环境：${ENV}`);
  try {
    checkPrerequisites();
    installDependencies();
    buildFrontend();
    initDatabase();
    generateDocsAndIndex();
    verifyI18nResources();
    startServer();

    const ok = await healthCheck();
    if (!ok) throw new Error('健康检查失败');

    log('✅ 部署完成，服务已就绪');
    log(`👉 访问地址：http://127.0.0.1:${process.env.PORT || 3000}/`);
  } catch (e) {
    error(e.message || String(e));
    rollback();
    process.exit(1);
  }
}

main();
