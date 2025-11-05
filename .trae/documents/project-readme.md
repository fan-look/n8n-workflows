# 多语言 n8n-workflows 项目

一个支持多语言的 n8n 工作流程管理系统，提供国际化界面和完整的构建部署解决方案。

## 🌟 项目概述

本项目基于 n8n 工作流程引擎，添加了完整的国际化支持，支持中英文切换，并提供一键式部署解决方案。项目采用前后端分离架构，前端使用原生 HTML/CSS/JavaScript，后端基于 Node.js + Express，数据库使用 SQLite。

### 主要特性
- 🌍 **多语言支持**：中英文界面切换，支持动态语言包加载
- 🚀 **一键部署**：完整的自动化部署脚本，支持开发/生产环境
- 📊 **工作流程管理**：浏览、搜索、管理工作流程
- 🔧 **API 接口**：完整的 RESTful API 支持
- 📱 **响应式设计**：适配桌面和移动设备
- 🛡️ **安全加固**：包含安全中间件和限流保护

## 🏗️ 技术栈

### 前端技术
- **核心**：原生 HTML5 + CSS3 + JavaScript (ES6+)
- **国际化**：i18next + 自定义语言检测器
- **UI 框架**：自定义组件库（基于现有组件扩展）
- **构建工具**：自定义构建脚本（Node.js）

### 后端技术
- **运行时**：Node.js 18+
- **框架**：Express.js 4.18+
- **数据库**：SQLite 5.1+
- **安全**：Helmet + CORS + Rate Limiting
- **压缩**：Gzip 压缩支持

### 部署与运维
- **进程管理**：原生 Node.js（可选 PM2）
- **容器化**：Docker 支持（可选）
- **反向代理**：Nginx 配置支持
- **监控**：健康检查端点

## 🚀 快速开始

### 环境要求
- Node.js 18.0 或更高版本
- npm 8.0 或更高版本
- 2GB 以上可用内存
- 1GB 以上磁盘空间

### 一键部署

#### 方法 1：使用 npm 脚本（推荐）
```bash
# 开发环境
npm run deploy:dev

# 生产环境
npm run deploy:prod

# 默认部署（开发环境）
npm run deploy
```

#### 方法 2：直接运行部署脚本
```bash
# Windows 用户
双击运行 scripts\deploy.bat

# 所有平台
node scripts/one-click-deploy.js --env production
```

### 手动部署步骤

如果需要手动控制每个步骤：

```bash
# 1. 安装依赖
npm install

# 2. 构建前端
npm run build

# 3. 初始化数据库
node src/init-db.js

# 4. 启动服务
npm start
```

## 📁 项目结构

```
n8n-workflows/
├── api/                    # 后端 API 代码
│   ├── server.js          # 主服务器文件
│   ├── i18n.js            # 多语言 API
│   └── i18n-storage.js    # 语言存储逻辑
├── static/                # 前端静态资源
│   ├── index.html         # 主页面
│   ├── js/                # JavaScript 文件
│   ├── styles/            # CSS 样式文件
│   └── locales/           # 语言资源文件
│       ├── en/            # 英文翻译
│       └── zh/            # 中文翻译
├── scripts/               # 构建和部署脚本
│   ├── build.js           # 前端构建脚本
│   ├── one-click-deploy.js # 一键部署脚本
│   └── deploy.bat         # Windows 部署脚本
├── src/                   # 后端源码
│   ├── database.js        # 数据库操作
│   └── init-db.js         # 数据库初始化
├── workflows/             # 工作流程定义文件
├── database/              # SQLite 数据库文件
├── dist/                  # 构建输出目录（自动生成）
└── docs/                  # 文档和说明
```

## 🔧 环境配置

### 开发环境 (.env.development)
```bash
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*
STATIC_DIR=./static
DEBUG=true
```

### 生产环境 (.env.production)
```bash
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://your-domain.com
STATIC_DIR=./dist/static
DEBUG=false
```

### 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| NODE_ENV | 运行环境 | development |
| PORT | 服务端口 | 3000 |
| CORS_ORIGIN | CORS 允许的源 | * |
| STATIC_DIR | 静态文件目录 | ./static |
| DEBUG | 调试模式 | false |

## 🌐 API 接口文档

### 基础接口

#### 健康检查
```http
GET /health
```

响应：
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

#### API 信息
```http
GET /api/info
```

### 多语言接口

#### 获取语言列表
```http
GET /api/i18n/languages
```

#### 获取翻译资源
```http
GET /api/i18n/translations/:language/:namespace
```

参数：
- `language`: 语言代码 (en, zh-CN)
- `namespace`: 命名空间 (ui, workflow)

#### 更新用户语言偏好
```http
POST /api/i18n/user-language
```

请求体：
```json
{
  "language": "zh-CN"
}
```

### 工作流程接口

#### 获取统计信息
```http
GET /api/stats
```

#### 搜索工作流程
```http
GET /api/workflows?q=email&trigger=all&complexity=all&page=1&per_page=20
```

#### 获取工作流程详情
```http
GET /api/workflows/:filename
```

## 🌍 多语言功能

### 支持的语言
- **English (en)**: 英文界面
- **简体中文 (zh-CN)**: 中文界面

### 语言切换
用户可以通过以下方式切换语言：
1. 界面右上角语言选择器
2. 浏览器语言自动检测
3. 用户个人设置

### 翻译文件结构
```
static/locales/
├── en/
│   └── translation.json    # 英文翻译
└── zh/
    └── translation.json    # 中文翻译
```

### 添加新语言
1. 在 `static/locales/` 创建新语言目录
2. 添加 `translation.json` 文件
3. 更新语言配置
4. 重启服务

## 🐛 故障排除

### 常见问题

#### 1. 部署失败
**问题**：一键部署脚本执行失败
**解决**：
```bash
# 检查 Node.js 版本
node -v

# 检查依赖完整性
npm install --force

# 手动清理并重新部署
rm -rf node_modules dist
npm run deploy:dev
```

#### 2. 语言切换无效
**问题**：切换语言后界面没有变化
**解决**：
- 检查浏览器控制台是否有错误
- 确认翻译文件存在且格式正确
- 清除浏览器缓存后重试

#### 3. 数据库初始化失败
**问题**：数据库无法创建或连接
**解决**：
```bash
# 检查数据库目录权限
ls -la database/

# 手动初始化数据库
node src/init-db.js

# 检查数据库文件是否存在
ls -la database/*.db
```

#### 4. 端口被占用
**问题**：端口 3000 已被占用
**解决**：
```bash
# 使用不同端口
PORT=3001 npm start

# 或者杀死占用进程
lsof -ti:3000 | xargs kill -9
```

### 日志查看
```bash
# 查看实时日志（Linux/Mac）
tail -f logs/app.log

# Windows 用户
# 日志文件位于项目根目录的 logs/ 文件夹
```

## 🔧 开发指南

### 本地开发
```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 添加新功能
1. 在相应目录创建文件
2. 遵循现有代码规范
3. 添加必要的注释
4. 测试功能完整性

### 代码规范
- 使用 2 个空格缩进
- 变量名使用 camelCase
- 函数名使用动词开头
- 添加适当的错误处理

## 🤝 贡献指南

### 如何贡献
1. Fork 项目仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 贡献类型
- 🐛 **Bug 修复**：修复现有问题
- ✨ **新功能**：添加新功能
- 📝 **文档改进**：改进文档和说明
- 🌍 **翻译**：添加新的语言支持
- ⚡ **性能优化**：提升系统性能

### 报告问题
报告问题时请包含：
- 问题描述
- 重现步骤
- 期望行为
- 实际行为
- 环境信息（操作系统、Node.js 版本等）

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果遇到问题：
1. 查看本文档的故障排除部分
2. 搜索现有 Issues
3. 创建新的 Issue 描述问题
4. 加入社区讨论

---

**Happy coding! 🎉**