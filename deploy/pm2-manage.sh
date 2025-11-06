#!/usr/bin/env bash
set -euo pipefail

# PM2 管理脚本（Linux）
# 用法：./deploy/pm2-manage.sh [start|stop|restart|status|logs] [env]
# 环境：development | staging | production（默认 development）

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
PROJECT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
ACTION=${1:-status}
ENV=${2:-development}

cd "$PROJECT_DIR"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[INFO] PM2 未安装，尝试安装..."
  npm install -g pm2
fi

mkdir -p "$PROJECT_DIR/logs"

case "$ACTION" in
  start)
    echo "[INFO] 启动 PM2 进程 (env=$ENV)"
    pm2 start ecosystem.config.js --env "$ENV"
    pm2 save
    ;;
  stop)
    echo "[INFO] 停止 PM2 进程"
    pm2 stop n8n-workflows-api || true
    pm2 save
    ;;
  restart)
    echo "[INFO] 重启 PM2 进程"
    pm2 restart n8n-workflows-api --update-env || pm2 start ecosystem.config.js --env "$ENV"
    pm2 save
    ;;
  status)
    echo "[INFO] 查看 PM2 进程状态"
    pm2 status n8n-workflows-api || pm2 status
    ;;
  logs)
    echo "[INFO] 查看 PM2 日志（Ctrl+C 退出）"
    pm2 logs n8n-workflows-api
    ;;
  *)
    echo "[ERROR] 不支持的操作: $ACTION"
    echo "用法：./deploy/pm2-manage.sh [start|stop|restart|status|logs] [env]"
    exit 1
    ;;
  esac