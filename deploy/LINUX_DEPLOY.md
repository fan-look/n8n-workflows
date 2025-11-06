# Linux 部署与后台运行指南

适用于常见 Linux 发行版（Ubuntu/Debian/CentOS 等），提供两种后台运行方式：PM2 管理与原生 nohup/systemd。

## 一、PM2 方式（推荐）

- 安装 PM2（首次使用）：
  ```bash
  npm install -g pm2
  ```
- 启动（默认 development）：
  ```bash
  ./deploy/pm2-manage.sh start
  ```
- 指定环境：`development | staging | production`
  ```bash
  ./deploy/pm2-manage.sh start production
  ```
- 停止/重启/状态/日志：
  ```bash
  ./deploy/pm2-manage.sh stop
  ./deploy/pm2-manage.sh restart
  ./deploy/pm2-manage.sh status
  ./deploy/pm2-manage.sh logs
  ```
- 说明：
  - 配置文件：`ecosystem.config.js`
  - 日志文件：`logs/pm2-out.log`、`logs/pm2-error.log`
  - 开机自启（可选）：
    ```bash
    pm2 save
    pm2 startup
    ```

## 二、原生后台方式（不依赖 PM2）

- 启动后台：
  ```bash
  ./deploy/background-node.sh start
  ```
- 查看状态：
  ```bash
  ./deploy/background-node.sh status
  ```
- 停止后台：
  ```bash
  ./deploy/background-node.sh stop
  ```
- 查看输出日志：
  ```bash
  ./deploy/background-node.sh logs
  ```
- 日志路径：`logs/background-out.log` 与 `logs/background-error.log`

## 三、systemd 服务（可选）

- 将 `deploy/n8n-workflows.service` 复制到 `/etc/systemd/system/`：
  ```bash
  sudo cp deploy/n8n-workflows.service /etc/systemd/system/n8n-workflows.service
  ```
- 启用并启动：
  ```bash
  sudo systemctl daemon-reload
  sudo systemctl enable n8n-workflows
  sudo systemctl start n8n-workflows
  ```
- 查看状态与日志：
  ```bash
  systemctl status n8n-workflows
  journalctl -u n8n-workflows -f
  ```

## 四、常见问题

- 无法执行脚本：确保可执行权限：
  ```bash
  chmod +x deploy/pm2-manage.sh deploy/background-node.sh
  ```
- 尝试在 Linux 上运行 Windows `.bat` 或 `.ps1` 会失败，请使用本指南中的 `.sh` 或 systemd。
- 端口默认 `3000`，可通过环境变量 `PORT` 或在 `ecosystem.config.js` 中调整。
- 数据库为 `MySQL 8.0`；项目未使用 Supabase。
- 测试完成后请及时删除临时测试文档。