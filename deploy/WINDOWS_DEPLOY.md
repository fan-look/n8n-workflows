# Windows 部署与后台运行指南

适用于 Windows 11，提供两种后台运行方式：PM2 管理与原生 PowerShell 后台脚本。

## 一、PM2 方式（推荐）

- 安装 PM2（首次使用）：
  ```bat
  npm install -g pm2
  ```
- 启动（默认 development）：
  ```bat
  deploy\pm2-manage.bat start
  ```
- 指定环境：`development | staging | production`
  ```bat
  deploy\pm2-manage.bat start production
  ```
- 停止/重启/状态/日志：
  ```bat
  deploy\pm2-manage.bat stop
  deploy\pm2-manage.bat restart
  deploy\pm2-manage.bat status
  deploy\pm2-manage.bat logs
  ```
- PM2 使用 `ecosystem.config.js`，日志写入 `logs/pm2-*.log`。

## 二、原生后台方式（不依赖 PM2）

- 启动后台：
  ```bat
  deploy\background-node.bat start
  ```
- 查看状态：
  ```bat
  deploy\background-node.bat status
  ```
- 停止后台：
  ```bat
  deploy\background-node.bat stop
  ```
- 查看输出日志：
  ```bat
  deploy\background-node.bat logs
  ```
- 日志路径：`logs/background-out.log` 与 `logs/background-error.log`

## 三、注意事项

- 当前一键启动 `npm start` 会占用终端；若需释放终端，请使用上面两种后台方式。
- 首次运行会在项目根目录创建 `logs/` 目录。
- 如需开机自启，可使用 PM2 的 `pm2 startup` 功能生成系统服务（需管理员权限）。
- 数据库使用 `MySQL 8.0`（项目未使用 Supabase）。
- 测试完成后请及时删除临时测试文档（如不再需要的 *.md）。

## 四、常见问题

- 端口默认 `3000`，可在 `ecosystem.config.js` 中通过环境变量 `PORT` 调整。
- 如果 PowerShell 执行策略阻止脚本，使用管理员运行：
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```