# n8n 工作流管理系统 - 项目使用指南

## 项目概述

本项目是一个基于 Node.js 和 MySQL 的 n8n 工作流管理系统，提供工作流的导入、分析、修复和性能优化功能。系统支持多语言国际化，具有现代化的 Web 界面。

## 系统架构

### 前端技术栈
- **HTML5 + CSS3 + JavaScript (ES6+)**
- **i18next** - 国际化框架
- **Bootstrap** - UI 框架
- **Chart.js** - 数据可视化
- **响应式设计** - 支持移动端

### 后端技术栈
- **Node.js** - 运行时环境
- **Express.js** - Web 框架
- **MySQL 8.0** - 数据库
- **JWT** - 身份验证
- **压缩中间件** - 性能优化
- **Helmet** - 安全中间件

## 快速开始

### 环境要求
- Node.js 16+ 
- MySQL 8.0+
- npm 或 pnpm

### 安装步骤

1. **克隆项目**
```bash
git clone <项目地址>
cd n8n-workflows
```

2. **安装依赖**
```bash
npm install
# 或使用 pnpm
pnpm install
```

3. **配置数据库**
```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE n8n_workflows CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 导入数据表结构
mysql -u root -p n8n_workflows < database/schema.sql
```

4. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置数据库连接信息
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=n8n_workflows
DB_PORT=3306
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
PORT=3000
```

5. **启动应用**
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

6. **访问应用**
打开浏览器访问: http://localhost:3000

## 功能特性

### 核心功能
1. **工作流管理**
   - 批量导入 n8n 工作流文件
   - 工作流分析和统计
   - 性能评估和优化建议
   - 错误检测和修复

2. **多语言支持**
   - 智能语言检测
   - 用户语言偏好存储
   - 实时语言切换
   - 支持英语和中文

3. **数据可视化**
   - 工作流性能图表
   - 错误统计图表
   - 系统状态监控

4. **API 接口**
   - RESTful API 设计
   - JWT 身份验证
   - 翻译数据管理

## 使用指南

### 工作流管理

#### 导入工作流
1. 访问主页面
2. 点击"导入工作流"按钮
3. 选择工作流 JSON 文件
4. 系统自动解析和存储

#### 分析工作流
1. 在工作流列表中选择目标工作流
2. 查看详细分析报告
3. 获取性能优化建议

#### 修复工作流
1. 系统自动检测错误
2. 提供修复建议
3. 一键修复功能

### 多语言使用

#### 自动语言检测
系统会根据浏览器设置自动选择语言

#### 手动切换语言
1. 点击页面右上角的语言切换按钮
2. 选择目标语言
3. 系统立即切换界面语言

#### 语言偏好存储
用户的语言选择会被保存，下次访问时自动应用

### API 使用

#### 获取翻译数据
```bash
# 获取指定语言的翻译
GET /api/i18n/translations/{language}/{namespace}

# 示例
GET /api/i18n/translations/en/common
```

#### 更新翻译数据
```bash
# 更新翻译
PUT /api/i18n/translations/{language}/{namespace}
Content-Type: application/json

{
  "key": "value",
  "nested.key": "nested value"
}
```

## 配置说明

### 数据库配置
```sql
-- 主要数据表
workflows - 工作流基本信息
workflow_nodes - 工作流节点详情
workflow_connections - 节点连接关系
workflow_performance - 性能数据
translations - 多语言翻译数据
translation_cache - 翻译缓存
```

### 环境变量详解
```bash
# 数据库配置
DB_HOST=localhost          # 数据库主机
DB_USER=root               # 数据库用户
DB_PASSWORD=password       # 数据库密码
DB_NAME=n8n_workflows      # 数据库名称
DB_PORT=3306               # 数据库端口

# 应用配置
NODE_ENV=development       # 运行环境
PORT=3000                  # 应用端口
JWT_SECRET=your_secret     # JWT 密钥

# 多语言配置
I18N_DEBUG=false           # i18next 调试模式
I18N_FALLBACK_LANGUAGE=en  # 默认回退语言
I18N_SUPPORTED_LANGUAGES=en,zh  # 支持的语言
I18N_DEFAULT_NAMESPACE=common   # 默认命名空间
```

### i18next 配置
```javascript
// 主要配置项
{
  debug: false,                    // 调试模式
  fallbackLng: 'en',               // 回退语言
  supportedLngs: ['en', 'zh'],    // 支持语言
  backend: {
    loadPath: '/api/i18n/translations/{{lng}}/{{ns}}',
    addPath: '/api/i18n/translations/{{lng}}/{{ns}}',
    crossDomain: false
  },
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage']
  }
}
```

## 开发指南

### 项目结构
```
n8n-workflows/
├── api/                    # 后端 API
│   ├── server.js          # 主服务器文件
│   ├── routes/            # API 路由
│   ├── middleware/        # 中间件
│   └── utils/             # 工具函数
├── static/                # 前端静态文件
│   ├── index.html        # 主页面
│   ├── css/              # 样式文件
│   ├── js/               # JavaScript 文件
│   └── images/           # 图片资源
├── database/              # 数据库相关
│   ├── schema.sql        # 数据表结构
│   └── migrations/       # 数据库迁移
├── workflows/            # 工作流文件存储
├── scripts/              # 脚本工具
└── docs/                 # 文档
```

### 添加新功能
1. 遵循现有代码结构
2. 添加必要的 API 端点
3. 更新前端界面
4. 添加多语言支持
5. 编写测试用例

### 代码规范
- 使用 ES6+ 语法
- 遵循 Airbnb JavaScript 风格指南
- 添加必要的注释
- 保持函数简洁

## 故障排除

### 常见问题

#### 1. 数据库连接失败
- 检查数据库服务是否运行
- 验证数据库配置信息
- 检查网络连接

#### 2. 工作流导入失败
- 验证 JSON 文件格式
- 检查文件编码
- 查看错误日志

#### 3. 多语言切换无效
- 清除浏览器缓存
- 检查 localStorage
- 验证翻译数据

#### 4. 性能问题
- 检查数据库索引
- 优化查询语句
- 启用缓存机制

### 日志查看
```bash
# 查看应用日志
tail -f logs/app.log

# 查看错误日志
tail -f logs/error.log
```

## 性能优化

### 前端优化
- 启用压缩中间件
- 使用 CDN 加速
- 图片懒加载
- 代码分割

### 后端优化
- 数据库索引优化
- 查询缓存
- 连接池配置
- API 响应压缩

### 数据库优化
- 合理设计索引
- 定期清理无用数据
- 使用查询缓存
- 监控慢查询

## 安全建议

### 应用安全
- 使用 HTTPS
- 输入验证和过滤
- JWT 密钥定期更换
- 错误信息脱敏

### 数据库安全
- 使用强密码
- 限制数据库访问
- 定期备份
- 敏感数据加密

## 部署指南

### 生产环境部署
1. 配置反向代理 (Nginx)
2. 设置进程管理 (PM2)
3. 配置 SSL 证书
4. 设置环境变量
5. 启用日志轮转

### Docker 部署
```dockerfile
# Dockerfile 示例
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 监控和告警
- 系统资源监控
- 应用性能监控
- 错误率监控
- 数据库监控

## 更新日志

### v1.0.0 (当前版本)
- ✨ 多语言国际化支持
- ✨ 工作流性能分析
- ✨ 错误检测和修复
- ✨ 数据可视化图表
- ✨ RESTful API 接口

## 贡献指南

欢迎提交 Issue 和 Pull Request！

### 提交规范
- 清晰的提交信息
- 必要的测试用例
- 更新相关文档
- 遵循代码规范

## 许可证

MIT License

## 联系方式

如有问题，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件至项目维护者

---

**最后更新**: 2024年11月
**文档版本**: v1.0.0