#!/usr/bin/env node

/**
 * 统一启动脚本
 * 负责启动完整的N8N Workflows应用（前端+后端一体化）
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 配置
const CONFIG = {
  // 服务器配置
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // 文件路径
  SERVER_FILE: path.join(__dirname, '../api/server.js'),
  PACKAGE_FILE: path.join(__dirname, '../package.json'),
  ENV_FILE: path.join(__dirname, '../.env'),
  
  // 启动选项
  AUTO_OPEN_BROWSER: process.env.AUTO_OPEN_BROWSER !== 'false',
  SHOW_WELCOME_MESSAGE: process.env.SHOW_WELCOME_MESSAGE !== 'false'
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 日志函数
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  highlight: (msg) => console.log(`${colors.cyan}${colors.bright}${msg}${colors.reset}`)
};

// 检查环境
function checkEnvironment() {
  log.info('检查环境配置...');
  
  // 检查Node.js版本
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 16) {
    log.error(`Node.js版本过低: ${nodeVersion}, 需要16.0.0或更高版本`);
    process.exit(1);
  }
  
  log.success(`Node.js版本检查通过: ${nodeVersion}`);
  
  // 检查必需文件
  const requiredFiles = [
    { path: CONFIG.SERVER_FILE, name: '服务器文件' },
    { path: CONFIG.PACKAGE_FILE, name: 'package.json' }
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file.path)) {
      log.error(`缺少必需文件: ${file.name} (${file.path})`);
      process.exit(1);
    }
  }
  
  // 检查.env文件
  if (!fs.existsSync(CONFIG.ENV_FILE)) {
    log.warning('未找到.env文件，将使用默认配置');
    log.info('如需自定义配置，请复制.env.example为.env并修改');
  }
  
  log.success('环境检查完成');
}

// 检查端口
function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

// 启动服务器
async function startServer() {
  log.info('正在启动N8N Workflows服务器...');
  
  // 检查端口
  const portAvailable = await checkPort(CONFIG.PORT);
  if (!portAvailable) {
    log.error(`端口 ${CONFIG.PORT} 已被占用`);
    log.info('请检查是否有其他服务占用了该端口，或修改.env文件中的PORT配置');
    process.exit(1);
  }
  
  // 设置环境变量
  process.env.NODE_ENV = CONFIG.NODE_ENV;
  process.env.PORT = CONFIG.PORT;
  
  // 启动子进程
  const serverProcess = spawn('node', [CONFIG.SERVER_FILE], {
    stdio: 'pipe',
    cwd: path.join(__dirname, '..'),
    env: process.env
  });
  
  // 输出处理
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    
    // 检测服务器启动成功
    if (output.includes('服务器运行在端口') || output.includes('Server running on port')) {
      log.success('服务器启动成功！');
      showWelcomeMessage();
    }
    
    console.log(output);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`${colors.red}[SERVER ERROR]${colors.reset} ${data}`);
  });
  
  serverProcess.on('close', (code) => {
    if (code !== 0) {
      log.error(`服务器进程异常退出，退出码: ${code}`);
      log.info('请检查错误日志并重新启动');
    }
    process.exit(code);
  });
  
  serverProcess.on('error', (err) => {
    log.error(`启动服务器失败: ${err.message}`);
    process.exit(1);
  });
  
  // 处理进程退出
  process.on('SIGINT', () => {
    log.info('正在关闭服务器...');
    serverProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    log.info('正在关闭服务器...');
    serverProcess.kill('SIGTERM');
  });
}

// 显示欢迎信息
function showWelcomeMessage() {
  if (!CONFIG.SHOW_WELCOME_MESSAGE) return;
  
  console.log('\n' + '='.repeat(60));
  log.highlight('🚀 N8N Workflows 多语言国际化系统');
  console.log('='.repeat(60));
  
  log.success(`✅ 服务器运行在: http://localhost:${CONFIG.PORT}`);
  log.info(`📁 静态文件目录: ./static`);
  log.info(`🌍 支持语言: 英文、中文`);
  log.info(`📊 工作流数量: 2000+`);
  
  console.log('\n📋 快速访问:');
  console.log(`  • 主应用: http://localhost:${CONFIG.PORT}`);
  console.log(`  • 多语言API: http://localhost:${CONFIG.PORT}/api/i18n`);
  console.log(`  • 工作流API: http://localhost:${CONFIG.PORT}/api/workflows`);
  console.log(`  • 健康检查: http://localhost:${CONFIG.PORT}/health`);
  console.log(`  • API文档: http://localhost:${CONFIG.PORT}/api/info`);
  
  console.log('\n⚡ 快捷键:');
  console.log('  • Ctrl+C: 安全关闭服务器');
  console.log('  • 访问 /api/info 查看详细API文档');
  
  console.log('\n' + '='.repeat(60));
  
  // 自动打开浏览器
  if (CONFIG.AUTO_OPEN_BROWSER && CONFIG.NODE_ENV === 'development') {
    setTimeout(() => {
      const { exec } = require('child_process');
      const url = `http://localhost:${CONFIG.PORT}`;
      
      let command;
      switch (process.platform) {
        case 'win32':
          command = `start ${url}`;
          break;
        case 'darwin':
          command = `open ${url}`;
          break;
        default:
          command = `xdg-open ${url}`;
      }
      
      exec(command, (err) => {
        if (err) {
          log.warning('无法自动打开浏览器，请手动访问');
        } else {
          log.info('已自动在浏览器中打开应用');
        }
      });
    }, 2000);
  }
}

// 主函数
async function main() {
  try {
    console.clear();
    log.highlight('🚀 N8N Workflows 统一启动脚本');
    console.log('');
    
    checkEnvironment();
    await startServer();
    
  } catch (error) {
    log.error(`启动失败: ${error.message}`);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { main, startServer, checkEnvironment };