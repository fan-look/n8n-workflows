#!/usr/bin/env bash
set -euo pipefail

# 将指定文件的 CRLF 转为 LF，防止 shebang 报错
# 用法：
#   ./scripts/fix-line-endings.sh
# 会自动修复 deploy/*.sh 和 *.service

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
PROJECT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

fix_file() {
  local f="$1"
  if [[ -f "$f" ]]; then
    sed -i 's/\r$//' "$f"
    echo "[fixed] $f"
  fi
}

# 修复 deploy 下的 sh 和 service
for f in "$PROJECT_DIR"/deploy/*.sh; do fix_file "$f"; done
for f in "$PROJECT_DIR"/deploy/*.service; do fix_file "$f"; done

# 可选：修复 scripts 下的 sh
for f in "$PROJECT_DIR"/scripts/*.sh; do fix_file "$f"; done

echo "[done] 行尾修复完成。建议重新 chmod +x："
echo "chmod +x deploy/*.sh scripts/*.sh"