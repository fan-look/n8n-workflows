# N8N Workflows 多语言国际化系统

基于已确认的多语言技术架构文档，实现了完整的多语言适配功能，支持英文/中文切换，使用 i18next 作为前端国际化库，并采用本地文件存储翻译数据与用户语言首。

## 🌟 功能特性
- 多语言支持：支持英文和中文切换
- 后端集成：使用 Node.js + Express 提供 API，采用本地文件存储
- 前端国际化：基于 i18next 的完整国际化解决方案
- UI 标准：统一的 UI 组件样式和设计规范
- 性能优化：本地缓存与异步加载机制
- 无障碍支持：完整的 ARIA 标签与键盘导航
- 智能语言检测：自动检测用户浏览器语言偏好
- 用户偏好存储：记住用户的语言选择设置
- 实时翻译切换：无需刷新页面即可切换语言
- 翻译数据管理：支持动态添加与更新翻译内容

## 🏗️ 技术架构

### 前端技术栈
- i18next：国际化核心库
- i18next-browser-languageDetector：浏览器语言检测
- i18next-localStorage-backend：本地存储后端
- i18next-http-backend：HTTP 后端，支持动态加载翻译数据
- 现代 CSS：CSS 变量、Flexbox、Grid 布局
- 组件化架构：模块化 JavaScript 组件设计

### 后端技术栈
- Node.js + Express：后端 API 服务
- 本地文件存储：`static/locales/{lng}/translation.json` 与 `data/i18n/user-prefs.json`
- 限流：API 请求频率控制
- 压缩：响应数据压缩优化
- 安全：Helmet 安全中间件

### 存储设计
- 翻译文件：`static/locales/{lng}/translation.json`
- 用户语言偏好：`data/i18n/user-prefs.json`
- 支持语言列表：自动扫描 `static/locales` 下的语言目录

## 🚀 快速开始

### 环境要求
- Node.js 16+
- npm 或 pnpm

### 安装依赖
```
npm install
```

### 环境配置
```
cp .env.example .env
# 无需数据库配置；使用本地文件存储
```

### 启动服务
```
# 开发模式
npm run dev

# 生产模式
npm start
```

### 访问应用
- 主应用：`http://localhost:3000`
- 多语言 API：`http://localhost:3000/api/i18n`
- 健康检查：`http://localhost:3000/health`
- API 文档：`http://localhost:3000/api/info`

### 多语言功能使用
- 自动语言检测：系统会自动检测浏览器语言
- 手动语言切换：点击页面右上角的语言切换按钮
- 语言偏好存储：语言选择会被自动保存
- 实时翻译：切换语言后页面内容立即更新

### 支持的翻译键示例
- `common.title`
- `common.search`
- `workflow.createWorkflow`

## 📋 API 文档

### 获取用户语言偏好
```
GET /api/i18n/user-language/:userId
```

### 保存用户语言偏好
```
POST /api/i18n/user-language
Content-Type: application/json
{
  "userId": "user123",
  "language": "zh"
}
```

### 获取翻译数据
```
GET /api/i18n/translations/:language/:namespace
```

### 批量获取翻译数据
```
POST /api/i18n/translations/batch
Content-Type: application/json
{
  "language": "zh",
  "namespaces": ["common", "workflow"]
}
```

### 获取支持的语言列表
```
GET /api/i18n/languages
```

## 🎨 UI 标准

### CSS 变量
```
:root {
  --primary: #3b82f6;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --bg: #ffffff;
  --text: #1e293b;
}
```

### 组件规范
- 优先使用统一的组件与全局样式
- 新增组件或样式时先在 UI 标准文件中定义

## 🧹 清理说明
- 已移除 MySQL 相关文件与依赖（`api/i18n-api.js`, `api/i18n-routes.js`, `mysql2`）
- 测试文档已按需清理

## 📁 项目结构
```
n8n-workflows/
├── api/
│   ├── i18n.js
│   └── server.js
├── static/
│   ├── js/
│   │   ├── i18n-config.js
│   │   ├── i18n-backend.js
│   │   └── LanguageSwitch.js
│   ├── locales/
│   │   ├── en/
│   │   │   └── translation.json
│   │   └── zh/
│   │       └── translation.json
│   ├── styles/
│   │   ├── ui-standards.css
│   │   └── i18n-global.css
│   └── index.html
├── data/
│   └── i18n/
│       └── user-prefs.json
├── package.json
├── .env.example
└── README.md
```

## 🔧 配置选项
- `I18N_FALLBACK_LANGUAGE=en`
- `I18N_SUPPORTED_LANGUAGES=en,zh`
- `I18N_DEFAULT_NAMESPACE=common`