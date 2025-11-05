# Nginx 部署使用指南（n8n-workflows）

适用于将本项目部署到 Linux 服务器上的 Nginx。包含安装、证书申请、配置上线、常用命令、故障排查与性能监控建议。

- 配置文件示例：`deploy/nginx.conf`
- 后端端口：默认 `3000`（可通过 `PORT` 环境变量变更）
- 静态资源构建目录：`dist/static`

---

## 1. 基本安装与准备

- Debian/Ubuntu：
  - `sudo apt update && sudo apt install -y nginx`
- CentOS/RHEL：
  - `sudo yum install -y epel-release && sudo yum install -y nginx`
- 防火墙开放：
  - `sudo ufw allow 'Nginx Full'` 或 `sudo ufw allow 80 && sudo ufw allow 443`
- 检查 Nginx 版本：
  - `nginx -v`

> 注意：生产环境建议使用 HTTPS（见下文证书申请）。

---

## 2. 证书申请（Let's Encrypt）

- 使用 Snap（Ubuntu 推荐）：
  - `sudo snap install core && sudo snap refresh core`
  - `sudo snap install certbot --classic`
  - `sudo ln -s /snap/bin/certbot /usr/bin/certbot`
  - 自动申请并配置 Nginx：
    - `sudo certbot --nginx -d your.domain.com`
  - 自动续期测试：
    - `sudo certbot renew --dry-run`

- 使用 apt（Debian/Ubuntu 另选）：
  - `sudo apt install -y certbot python3-certbot-nginx`
  - `sudo certbot --nginx -d your.domain.com`

> 申请证书前，请将域名解析到服务器公网 IP。

---

## 3. 配置文件部署步骤

1) 将仓库中的示例拷贝到服务器：
   - `scp deploy/nginx.conf user@server:/etc/nginx/conf.d/n8n-workflows.conf`

2) 编辑域名与静态路径：
   - 替换 `your.domain.com` 为你的真实域名
   - 如需由 Nginx 直接服务静态文件，设置：
     - `set $STATIC_ROOT "/var/www/n8n-workflows/dist/static";`
     - 将本地构建目录 `dist/static` 同步到服务器该路径
   - 如果希望“整站反代到端口”，则保持 `/api/`、`/health` 与 `/` 都走 `proxy_pass http://127.0.0.1:3000;`

3) 语法检查与重载：
   - `sudo nginx -t`
   - `sudo systemctl reload nginx`

4) 后端启动（参考项目一键部署脚本）：
   - 在服务器上运行：`node scripts/one-click-deploy.js --env production`
   - 或使用：`npm run deploy:prod`

---

## 4. 常用管理命令

- 检查配置语法：`sudo nginx -t`
- 平滑重载：`sudo nginx -s reload` 或 `sudo systemctl reload nginx`
- 启动/重启/停止：
  - `sudo systemctl start nginx`
  - `sudo systemctl restart nginx`
  - `sudo systemctl stop nginx`
- 查看运行状态：`sudo systemctl status nginx`
- 查看日志：
  - 访问日志（路径因系统不同）：`/var/log/nginx/access.log`
  - 错误日志：`/var/log/nginx/error.log`

---

## 5. 故障排除指南

- 502 Bad Gateway：
  - 后端端口未启动或端口不一致（默认 3000）
  - 防火墙阻止了端口访问（本机反代通常不受影响）

- 404 或静态资源加载失败：
  - `STATIC_ROOT` 路径不正确或未同步 `dist/static`
  - 使用“整站反代”模式时无需设置 `STATIC_ROOT`

- CSP 拦截脚本/样式：
  - 本项目后端已通过 `helmet` 设置 CSP，前端使用了 jsDelivr 的脚本，需保留相应源（见 `api/server.js`）

- HTTPS 证书问题：
  - 域名未解析到服务器
  - Certbot 配置错误，查看：`sudo tail -f /var/log/letsencrypt/letsencrypt.log`

- SELinux/权限：
  - 在开启 SELinux 的系统上，确认 Nginx 可读静态目录

---

## 6. 性能与监控建议

- 启用 Gzip 压缩（已在示例中开启），可加入 Brotli（需模块支持）
- 反代模式：将 `/static/` 由 Nginx 直接服务，`/api/` 与 `/health` 代理到后端
- 连接与超时：根据流量适当调整 `keepalive`、`proxy_read_timeout`
- 监控：
  - 开启 `stub_status`（需额外 location）或使用 Prometheus + nginx-exporter
  - 结合系统工具：`htop`、`ss -tulpn`、`iostat`、`vmstat`
- 日志轮转：确保 `/var/log/nginx` 已进行轮转，避免日志过大

---

## 7. 配置模式选择建议

- 整站反代到端口（最省事）：
  - Node 同时提供 `/static` 和 `/api`，Nginx 主要负责 TLS 与反代
  - 适合快速上线，减少静态目录同步工作

- Nginx 直接服务静态 + 仅代理 API（更高效）：
  - Nginx 负责静态加速与缓存，API 走后端端口
  - 适合前端资源较多且追求更高静态性能的场景

---

## 8. 与项目的一键部署配合

- 本项目提供 `scripts/one-click-deploy.js`：一键安装依赖、构建静态、初始化数据库、启动服务与健康检查
- npm 别名：
  - 开发：`npm run deploy`
  - 预发：`npm run deploy:staging`
  - 生产：`npm run deploy:prod`
- Windows 双击批处理：`scripts/deploy.bat`（默认 development，可传入环境参数）

---

## 9. 下一步