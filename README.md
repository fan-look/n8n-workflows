# N8N Workflows 多语言国际化系统

基于已确认的多语言技术架构文档，实现了完整的多语言适配功能，支持英文/中文切换，使用 i18next 作为前端国际化库，并采用本地文件存储翻译数据与用户语言偏好。系统集成了工作流数据库、智能搜索、分类管理和可视化图表等高级功能。

## 🌟 功能特性
- 多语言支持：支持英文和中文切换，自动语言检测
- 工作流数据库：SQLite数据库存储2000+工作流元数据
- 智能搜索：支持名称、描述、集成类型等多维度搜索
- 分类管理：自动分类和手动分类映射
- 可视化图表：Mermaid流程图生成和交互式查看
- 高级筛选：按触发器类型、复杂度、分类、状态筛选
- 响应式设计：支持移动端和桌面端完美适配
- 主题切换：支持深色/浅色主题自动切换
- 性能优化：本地缓存、异步加载、分页加载
- 无障碍支持：完整的ARIA标签与键盘导航
- 实时翻译切换：无需刷新页面即可切换语言
- 翻译数据管理：支持动态添加与更新翻译内容

## 🏗️ 技术架构

### 前端技术栈
- i18next：国际化核心库
- i18next-browser-languageDetector：浏览器语言检测
- i18next-localStorage-backend：本地存储后端
- i18next-http-backend：HTTP后端，支持动态加载翻译数据
- Mermaid：流程图可视化库
- 现代CSS：CSS变量、Flexbox、Grid布局
- 原生JavaScript：模块化组件设计，无框架依赖

### 后端技术栈
- Node.js + Express：后端API服务
- SQLite数据库：工作流元数据存储
- 本地文件存储：`static/locales/{lng}/translation.json`与`data/i18n/user-prefs.json`
- 限流：API请求频率控制
- 压缩：响应数据压缩优化
- 安全：Helmet安全中间件，CSP内容安全策略

### 存储设计
- 翻译文件：`static/locales/{lng}/translation.json`
- 用户语言偏好：`data/i18n/user-prefs.json`
- 工作流数据库：`workflow_db.sqlite`
- 支持语言列表：自动扫描`static/locales`下的语言目录
- 分类数据：`context/unique_categories.json`和`context/search_categories.json`

## 🚀 快速开始

### 环境要求
- Node.js 16+
- npm或pnpm

### 安装依赖
```
npm install
# 或使用pnpm
pnpm install
```

### 环境配置
```
cp .env.example .env
# 无需数据库配置；使用本地文件存储和SQLite
```

### 启动服务
```
# 开发模式
npm run dev

# 生产模式
npm start

# 使用PM2进程管理器
npm run pm2:start
```

### 访问应用
- 主应用：`http://localhost:3000`
- 多语言API：`http://localhost:3000/api/i18n`
- 工作流API：`http://localhost:3000/api/workflows`
- 健康检查：`http://localhost:3000/health`
- API文档：`http://localhost:3000/api/info`

### 多语言功能使用
- 自动语言检测：系统会自动检测浏览器语言
- 手动语言切换：点击页面右上角的语言切换按钮
- 语言偏好存储：语言选择会被自动保存到本地存储
- 实时翻译：切换语言后页面内容立即更新
- 翻译回退：未翻译内容自动回退到英文

## 📋 API文档

### 多语言API

#### 获取用户语言偏好
```
GET /api/i18n/user-language/:userId
```

#### 保存用户语言偏好
```
POST /api/i18n/user-language
Content-Type: application/json
{
  "userId": "user123",
  "language": "zh"
}
```

#### 获取翻译数据
```
GET /api/i18n/translations/:language/:namespace
```

#### 批量获取翻译数据
```
POST /api/i18n/translations/batch
Content-Type: application/json
{
  "language": "zh",
  "namespaces": ["common", "workflow"]
}
```

#### 获取支持的语言列表
```
GET /api/i18n/languages
```

### 工作流API

#### 获取工作流列表
```
GET /api/workflows?q=搜索词&trigger=all&complexity=all&active_only=false&page=1&per_page=20
```

#### 获取工作流详情
```
GET /api/workflows/:filename
```

#### 下载工作流JSON文件
```
GET /api/workflows/:filename/download
```

#### 获取工作流流程图
```
GET /api/workflows/:filename/diagram
```

#### 获取统计信息
```
GET /api/stats
```

#### 获取分类列表
```
GET /api/categories
```

#### 获取分类映射
```
GET /api/category-mappings
```

#### 重新索引工作流
```
POST /api/reindex
{
  "force": true
}
```

## 🎨 UI标准

### CSS变量
```css
:root {
  --primary: #3b82f6;
  --primary-dark: #2563eb;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --bg: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border: #e2e8f0;
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

[data-theme="dark"] {
  --bg: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --text: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #64748b;
  --border: #475569;
}
```

### 组件规范
- 优先使用统一的组件与全局样式
- 新增组件或样式时先在UI标准文件中定义
- 遵循无障碍设计原则，支持键盘导航
- 响应式设计，适配各种屏幕尺寸
- 使用CSS变量实现主题切换

## 📁 项目结构
```
n8n-workflows/
├── api/                          # 后端API
│   ├── i18n.js                  # 多语言API路由
│   ├── i18n-storage.js          # 多语言存储管理
│   └── server.js                # 主服务器文件
├── static/                       # 静态资源
│   ├── js/                      # JavaScript文件
│   │   ├── i18n-config.js       # i18next配置
│   │   ├── i18n-backend.js      # 自定义后端
│   │   ├── LanguageSwitch.js    # 语言切换组件
│   │   └── i18next-localstorage-backend.js # 本地存储后端
│   ├── locales/                 # 翻译文件
│   │   ├── en/                  # 英文翻译
│   │   │   └── translation.json
│   │   └── zh/                  # 中文翻译
│   │       └── translation.json
│   ├── styles/                  # 样式文件
│   │   ├── ui-standards.css     # UI标准样式
│   │   ├── i18n-global.css      # 多语言全局样式
│   │   └── i18n-ui-standards.js # UI标准工具
│   └── index.html               # 主页面
├── data/                        # 数据文件
│   └── i18n/                    # 多语言数据
│       └── user-prefs.json      # 用户语言偏好
├── context/                     # 分类数据
│   ├── unique_categories.json   # 唯一分类列表
│   └── search_categories.json   # 搜索分类映射
├── workflows/                   # 工作流JSON文件（2000+）
├── src/                         # 源代码
│   ├── database.js              # SQLite数据库管理
│   └── init-db.js               # 数据库初始化
├── config/                      # 配置文件
│   ├── .env.example             # 环境变量示例
│   ├── docker-compose.yml       # Docker配置
│   └── nginx.conf               # Nginx配置
├── scripts/                     # 脚本工具
│   ├── scan_workflow_i18n.js    # 工作流i18n扫描
│   ├── update_readme_stats.py   # README统计更新
│   └── health-check.sh          # 健康检查脚本
├── deploy/                      # 部署文件
│   ├── WINDOWS_DEPLOY.md        # Windows部署指南
│   ├── LINUX_DEPLOY.md          # Linux部署指南
│   ├── nginx-guide.md           # Nginx配置指南
│   └── pm2-manage.bat           # PM2管理脚本
├── tools/                       # 开发工具
│   ├── workflow_validator.py    # 工作流验证器
│   ├── workflow_fixer.py        # 工作流修复工具
│   └── workflow_excellence_upgrader.py # 工作流优化工具
├── tests/                       # 测试文件
│   ├── test_api.sh              # API测试脚本
│   └── test_security.sh         # 安全测试脚本
├── docs/                        # 文档站点（GitHub Pages）
├── backup/                      # 备份和报告文件
├── reports/                     # 生成报告
├── templates/                   # 模板文件
├── .github/workflows/           # GitHub Actions
├── package.json                 # 项目依赖
├── ecosystem.config.js          # PM2配置
├── Dockerfile                   # Docker镜像
├── requirements.txt             # Python依赖
└── README.md                    # 项目文档
```

## 🔧 配置选项
### 环境变量
- `PORT=3000`：服务器端口
- `NODE_ENV=development`：运行环境
- `STATIC_DIR=./static`：静态文件目录
- `CORS_ORIGIN=*`：CORS跨域配置
- `I18N_FALLBACK_LANGUAGE=en`：翻译回退语言
- `I18N_SUPPORTED_LANGUAGES=en,zh`：支持的语言列表
- `I18N_DEFAULT_NAMESPACE=common`：默认命名空间

### 多语言配置
- 支持语言：英文(en)、中文(zh)
- 翻译文件格式：JSON
- 命名空间支持：common, workflow, categories, ui
- 自动语言检测：基于浏览器语言
- 本地存储：localStorage缓存

### 性能配置
- 分页大小：20条/页（可配置）
- 最大分页：100条/页
- 限流：15分钟内1000次请求/IP
- 缓存：静态文件1天缓存（生产环境）
- 压缩：gzip压缩响应数据

## 🚀 部署选项

### 本地部署
```bash
# 克隆项目
git clone <repository-url>
cd n8n-workflows

# 安装依赖
npm install

# 配置环境
cp .env.example .env

# 启动服务
npm start
```

### Docker部署
```bash
# 构建镜像
docker build -t n8n-workflows .

# 运行容器
docker run -p 3000:3000 -v $(pwd)/data:/app/data n8n-workflows
```

### Docker Compose部署
```bash
# 使用Docker Compose
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### PM2部署
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs
```

### Nginx反向代理
参考`deploy/nginx-guide.md`文件进行配置。

## 🧪 测试
```bash
# API测试
./tests/test_api.sh

# 安全测试
./tests/test_security.sh

# 健康检查
./scripts/health-check.sh
```

## 📊 统计信息
- 总工作流数量：2000+
- 支持的集成：100+
- 分类数量：30+
- 翻译键数量：500+
- 支持语言：2种（英文、中文）

## 🧹 清理说明
- 已移除MySQL相关文件与依赖
- 已移除不必要的测试文档
- 优化了项目结构和依赖关系
- 清理了重复的配置文件

## 🔒 安全特性
- CSP内容安全策略
- Helmet安全中间件
- API请求限流
- CORS跨域控制
- 输入验证和清理
- 安全头部配置

## 📈 性能优化
- SQLite数据库索引优化
- 静态文件缓存策略
- 分页加载机制
- 异步数据加载
- 压缩和缓存
- 前端代码分割

## 🤝 贡献指南
1. Fork项目仓库
2. 创建特性分支
3. 提交代码更改
4. 运行测试套件
5. 提交Pull Request

## 📄 许可证
MIT License - 详见LICENSE文件

## 🆘 支持
如有问题，请在GitHub Issues中提交问题报告。