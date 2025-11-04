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

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

// 性能优化
app.use(compression());

// CORS配置
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

// 静态文件服务（开发环境禁用缓存，避免前端脚本更新不生效）
app.use('/static', express.static(path.join(__dirname, '../static'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: process.env.NODE_ENV === 'production',
  lastModified: true
}));

// 根路径重定向到静态文件
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../static/index.html'));
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

// 获取单个工作流详情
app.get('/api/workflows/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const detail = await db.getWorkflowDetail(filename);
    if (!detail) return res.status(404).json({ error: 'Workflow not found' });
    res.json(detail);
  } catch (error) {
    console.error('Error getting workflow detail:', error);
    res.status(500).json({ error: 'Failed to get workflow detail', message: error.message });
  }
});

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
      'GET /api/stats'
    ]
  });
});

// ===== 分类相关 API（移动到 404 之前） =====
const DEFAULT_CATEGORIES = [
  'AI Agent Development',
  'Business Process Automation',
  'CRM & Sales',
  'Cloud Storage & File Management',
  'Communication & Messaging',
  'Creative Content & Video Automation',
  'Creative Design Automation',
  'Data Processing & Analysis',
  'E-commerce & Retail',
  'Financial & Accounting',
  'Marketing & Advertising Automation',
  'Project Management',
  'Social Media Management',
  'Technical Infrastructure & DevOps',
  'Uncategorized',
  'Web Scraping & Data Extraction'
];

// /api/categories 返回可用分类（简单返回名称数组）
app.get('/api/categories', async (req, res) => {
  try {
    res.json({ categories: DEFAULT_CATEGORIES });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error fetching categories', details: error.message });
  }
});

// /api/category-mappings 返回 filename -> category 映射
app.get('/api/category-mappings', async (req, res) => {
  try {
    const fs = require('fs');
    const mappingPath = path.join(process.cwd(), 'context', 'search_categories.json');
    let mappings = {};

    if (fs.existsSync(mappingPath)) {
      const raw = fs.readFileSync(mappingPath, 'utf-8');
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach(item => {
          const filename = item && item.filename;
          const category = (item && item.category) || 'Uncategorized';
          if (filename) mappings[filename] = category;
        });
      }
    }

    res.json({ mappings });
  } catch (error) {
    console.error('Error fetching category mappings:', error);
    res.status(500).json({ error: 'Error fetching category mappings', details: error.message });
  }
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(error.status || 500).json({
    error: error.name || 'Internal server error',
    message: error.message || 'An unexpected error occurred',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// 启动服务器并在后台初始化/索引数据库
function startServer() {
  app.listen(PORT, () => {
    console.log(`🚀 N8N Workflows I18n Server running on port ${PORT}`);
    console.log(`📁 Static files served from: ${path.join(__dirname, '../static')}`);
    console.log(`🔧 API endpoints available at: http://localhost:${PORT}/api`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);

    // 后台初始化与索引
    db.initialize()
      .then(() => db.getStats())
      .then(async (stats) => {
        console.log('📊 DB Stats:', stats);
        if (!stats || stats.total === 0) {
          console.log('⚠️ 数据库为空，开始首次索引工作流...');
          const res = await db.indexWorkflows(true);
          console.log('✅ 首次索引完成：', res);
        }
      })
      .catch((err) => {
        console.error('❌ 数据库初始化失败：', err.message);
      });

    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️  Development mode enabled');
    }
  });
}

// 如果直接运行此文件，则启动服务器
if (require.main === module) {
  startServer();
}

module.exports = app;