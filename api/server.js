/**
 * 主服务器文件
 * 集成静态文件服务和多语言API + 工作流数据库
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 引入工作流数据库（SQLite）
const WorkflowDatabase = require('../src/database');
const db = new WorkflowDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件（HTTP 部署：关闭仅在安全上下文下有效/会产生警告的头）
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "http:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      // 关键修复：禁用浏览器自动升级到 HTTPS
      'upgrade-insecure-requests': null
    }
  },
  // 纯 HTTP 场景下关闭以下头，避免浏览器安全上下文警告
  crossOriginOpenerPolicy: false, // 禁止设置 COOP
  crossOriginEmbedderPolicy: false, // 禁止设置 COEP
  originAgentCluster: false, // 禁止设置 Origin-Agent-Cluster
  hsts: false, // 不发送 HSTS，避免浏览器强制升级为 HTTPS
  crossOriginResourcePolicy: false // 不强制 CORP
}));

// 额外防御：确保不意外发送相关安全头
app.use((req, res, next) => {
  res.removeHeader('Cross-Origin-Opener-Policy');
  res.removeHeader('Origin-Agent-Cluster');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  next();
});

// 性能优化
app.use(compression());

// CORS配置（HTTP 环境下允许跨域访问，可按需收紧）
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每个IP最多1000个请求
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

app.use(limiter);

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务（支持从构建输出目录读取：dist/static），开发环境禁用缓存
const fs = require('fs');
const STATIC_FALLBACK = path.join(__dirname, '../static');
const STATIC_DIST = path.join(__dirname, '../dist/static');
const STATIC_DIR = process.env.STATIC_DIR
  ? path.resolve(process.env.STATIC_DIR)
  : (fs.existsSync(STATIC_DIST) ? STATIC_DIST : STATIC_FALLBACK);

app.use('/static', express.static(STATIC_DIR, {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: process.env.NODE_ENV === 'production',
  lastModified: true
}));

// 根路径重定向到静态文件（根据静态目录返回 index.html）
app.get('/', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// 集成多语言API（本地文件存储）
const i18nRouter = require('./i18n');
app.use('/api/i18n', i18nRouter);

// ===== 工作流相关 API（使用数据库） =====

// 统计信息
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message
    });
  }
});

// 查询工作流
app.get('/api/workflows', async (req, res) => {
  try {
    const { q = '', trigger = 'all', complexity = 'all', active_only = false, page = 1, per_page = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const perPage = Math.min(100, Math.max(1, parseInt(per_page)));
    const offset = (pageNum - 1) * perPage;
    const activeOnly = String(active_only) === 'true';

    const { workflows, total } = await db.searchWorkflows(q, trigger, complexity, activeOnly, perPage, offset);
    const pages = Math.ceil(total / perPage);

    res.json({
      workflows,
      total,
      pages,
      page: pageNum,
      per_page: perPage,
      query: q,
      filters: { trigger, complexity, active_only: activeOnly }
    });
  } catch (error) {
    console.error('Error getting workflows:', error);
    res.status(500).json({
      error: 'Failed to get workflows',
      message: error.message
    });
  }
});

// 获取单个工作流详情（对齐前端字段：raw_json）
app.get('/api/workflows/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const detail = await db.getWorkflowDetail(filename);
    if (!detail) return res.status(404).json({ error: 'Workflow not found' });

    // 对齐字段命名，保持向后兼容
    if (detail.raw_workflow && !detail.raw_json) {
      detail.raw_json = detail.raw_workflow;
    }

    res.json(detail);
  } catch (error) {
    console.error('Error getting workflow detail:', error);
    res.status(500).json({ error: 'Failed to get workflow detail', message: error.message });
  }
});

// 新增：工作流 JSON 下载端点（兼容子目录）
app.get('/api/workflows/:filename/download', async (req, res) => {
  try {
    const { filename } = req.params;

    // 通过数据库获取文件所属子目录信息
    const detail = await db.getWorkflowDetail(filename);

    // 构造候选路径（根目录 + 记录的子目录）
    const rootCandidate = path.join(process.cwd(), 'workflows', filename);
    let filePath = rootCandidate;

    if (detail && detail.folder && String(detail.folder).trim()) {
      const folderCandidate = path.join(process.cwd(), 'workflows', detail.folder, filename);
      if (fs.existsSync(folderCandidate)) {
        filePath = folderCandidate;
      }
    }

    // 校验文件存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Workflow file not found', filename });
    }

    // 设置下载头并发送文件
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(filePath);
  } catch (error) {
    console.error('Error downloading workflow JSON:', error);
    return res.status(500).json({ error: 'Failed to download workflow', message: error.message });
  }
});

// 获取工作流图表（Mermaid）
app.get('/api/workflows/:filename/diagram', async (req, res) => {
  try {
    const { filename } = req.params;
    const detail = await db.getWorkflowDetail(filename);

    if (!detail || !detail.raw_workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const nodes = detail.raw_workflow.nodes || [];
    const connections = detail.raw_workflow.connections || {};
    const diagram = generateMermaidDiagram(nodes, connections);
    res.json({ diagram });
  } catch (error) {
    console.error('Error generating diagram:', error);
    res.status(500).json({ error: 'Failed to generate diagram', message: error.message });
  }
});

// Mermaid 图表生成工具
function generateMermaidDiagram(nodes, connections) {
  if (!nodes || nodes.length === 0) {
    return 'graph TD\n    A[No nodes found]';
  }

  let diagram = 'graph TD\n';

  // 添加节点
  nodes.forEach(node => {
    const nodeId = sanitizeNodeId(node.name);
    const nodeType = (node.type && String(node.type).split('.').pop()) || 'unknown';
    diagram += `    ${nodeId}["${node.name}\\n(${nodeType})"]\n`;
  });

  // 添加连接
  if (connections && typeof connections === 'object') {
    Object.entries(connections).forEach(([sourceNode, outputs]) => {
      const sourceId = sanitizeNodeId(sourceNode);

      if (outputs && outputs.main) {
        outputs.main.forEach(outputConnections => {
          outputConnections.forEach(connection => {
            const targetId = sanitizeNodeId(connection.node);
            diagram += `    ${sourceId} --> ${targetId}\n`;
          });
        });
      }
    });
  }

  return diagram;
}

function sanitizeNodeId(nodeName) {
  return String(nodeName || '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/^_+|_+$/g, '');
}

// 触发索引
app.post('/api/reindex', async (req, res) => {
  try {
    const { force = false } = req.body || {};
    db.indexWorkflows(Boolean(force)).then(r => {
      console.log('Indexing finished:', r);
    }).catch(e => console.error('Indexing error:', e));
    res.json({ message: 'Indexing started' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start indexing', message: error.message });
  }
});

// ===== 分类相关 API =====
// 从 context 文件读取分类与映射，兼容前端期望
const CONTEXT_DIR = path.join(process.cwd(), 'context');

// 获取分类列表
app.get('/api/categories', async (req, res) => {
  try {
    const uniqueCategoriesPath = path.join(CONTEXT_DIR, 'unique_categories.json');
    const searchCategoriesPath = path.join(CONTEXT_DIR, 'search_categories.json');

    // 优先使用预生成的唯一分类文件
    if (fs.existsSync(uniqueCategoriesPath)) {
      const raw = fs.readFileSync(uniqueCategoriesPath, 'utf-8');
      const categories = JSON.parse(raw);
      return res.json({ categories });
    }

    // 回退：从 search_categories.json 中提取唯一分类
    if (fs.existsSync(searchCategoriesPath)) {
      const raw = fs.readFileSync(searchCategoriesPath, 'utf-8');
      const searchData = JSON.parse(raw);
      const unique = new Set();
      searchData.forEach(item => {
        if (item && item.category) {
          unique.add(item.category);
        } else {
          unique.add('Uncategorized');
        }
      });
      return res.json({ categories: Array.from(unique).sort() });
    }

    // 最后兜底
    return res.json({ categories: ['Uncategorized'] });
  } catch (error) {
    console.error('Error loading categories:', error);
    res.status(500).json({ error: 'Failed to load categories', message: error.message });
  }
});

// 获取文件名到分类的映射
app.get('/api/category-mappings', async (req, res) => {
  try {
    const searchCategoriesPath = path.join(CONTEXT_DIR, 'search_categories.json');
    if (!fs.existsSync(searchCategoriesPath)) {
      return res.json({ mappings: {} });
    }

    const raw = fs.readFileSync(searchCategoriesPath, 'utf-8');
    const searchData = JSON.parse(raw);

    const mappings = {};
    searchData.forEach(item => {
      const filename = item && item.filename;
      const category = (item && item.category) || 'Uncategorized';
      if (filename) {
        mappings[filename] = category;
      }
    });

    res.json({ mappings });
  } catch (error) {
    console.error('Error loading category mappings:', error);
    res.status(500).json({ error: 'Failed to load category mappings', message: error.message });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: require('../package.json').version
  });
});

// API信息端点
app.get('/api/info', (req, res) => {
  res.json({
    name: 'N8N Workflows I18n API',
    version: require('../package.json').version,
    description: 'N8N workflows with internationalization support',
    features: [
      'Multi-language support',
      'User language preferences',
      'Translation management',
      'Static file serving',
      'Workflow database search'
    ],
    endpoints: [
      'GET /api/i18n/health',
      'GET /api/i18n/user-language/:userId',
      'POST /api/i18n/user-language',
      'GET /api/i18n/translations/:language/:namespace',
      'POST /api/i18n/translations/batch',
      'GET /api/i18n/languages',
      'GET /api/workflows',
      'GET /api/stats',
      'GET /api/workflows/:filename/diagram',
      'GET /api/categories',
      'GET /api/category-mappings'
    ]
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});