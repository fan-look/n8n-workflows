#!/usr/bin/env bash
set -euo pipefail

# 原生后台运行脚本（Linux，无 PM2）
# 用法：./deploy/background-node.sh [start|stop|status|logs]

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
PROJECT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
NODE_BIN=${NODE_BIN:-node}
SCRIPT_PATH="$PROJECT_DIR/api/server.js"
LOGS_DIR="$PROJECT_DIR/logs"
STDOUT_FILE="$LOGS_DIR/background-out.log"
STDERR_FILE="$LOGS_DIR/background-error.log"
PID_FILE="$SCRIPT_DIR/background.pid"

mkdir -p "$LOGS_DIR"

get_running_pid() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid=$(head -n1 "$PID_FILE" || true)
    if [[ -n "$pid" ]] && ps -p "$pid" >/dev/null 2>&1; then
      echo "$pid"
      return 0
    fi
  fi
  return 1
}

ACTION=${1:-status}
case "$ACTION" in
  start)
    if get_running_pid >/dev/null; then
      echo "[INFO] 后台进程已运行 (PID=$(get_running_pid))"
      exit 0
    fi
    echo "[INFO] 正在后台启动 Node 服务..."
    nohup "$NODE_BIN" "$SCRIPT_PATH" >"$STDOUT_FILE" 2>"$STDERR_FILE" &
    echo $! > "$PID_FILE"
    echo "[SUCCESS] 已启动后台进程 (PID=$!)"
    echo "[INFO] 日志: $STDOUT_FILE | $STDERR_FILE"
    ;;
  stop)
    if get_running_pid >/dev/null; then
      PID=$(get_running_pid)
      echo "[INFO] 停止进程 (PID=$PID)"
      kill "$PID" || true
      rm -f "$PID_FILE"
      echo "[SUCCESS] 已停止后台进程"
    else
      echo "[WARN] 未发现运行中的后台进程"
    fi
    ;;
  status)
    if get_running_pid >/dev/null; then
      echo "[STATUS] 运行中 (PID=$(get_running_pid))"
      echo "[INFO] 日志: $STDOUT_FILE"
    else
      echo "[STATUS] 未运行"
    fi
    ;;
  logs)
    echo "[INFO] 显示日志 (Ctrl+C 退出): $STDOUT_FILE"
    touch "$STDOUT_FILE"
    tail -n 200 -f "$STDOUT_FILE"
    ;;
  *)
    echo "用法：./deploy/background-node.sh [start|stop|status|logs]"
    exit 1
    ;;
esac