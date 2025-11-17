#!/bin/bash

# N8N Workflows 统一启动脚本 (Linux/macOS)
# 一键启动完整的应用（前端+后端一体化）

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_highlight() {
    echo -e "${CYAN}${1}${NC}"
}

# 检查Node.js
check_nodejs() {
    if ! command -v node &> /dev/null; then
        log_error "未检测到Node.js，请先安装Node.js 16.0.0或更高版本"
        log_info "下载地址: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    log_info "Node.js版本: $NODE_VERSION"
    
    # 检查版本号
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | cut -d'v' -f2)
    if [ "$MAJOR_VERSION" -lt 16 ]; then
        log_error "Node.js版本过低，需要16.0.0或更高版本"
        exit 1
    fi
}

# 检查项目文件
check_project_files() {
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
    
    cd "$PROJECT_DIR"
    log_info "项目目录: $PROJECT_DIR"
    
    if [ ! -f "api/server.js" ]; then
        log_error "缺少服务器文件: api/server.js"
        exit 1
    fi
    
    if [ ! -f "package.json" ]; then
        log_error "缺少项目配置文件: package.json"
        exit 1
    fi
}

# 检查依赖
check_dependencies() {
    if [ ! -d "node_modules" ]; then
        log_warning "未找到node_modules，正在安装依赖..."
        npm install
        if [ $? -ne 0 ]; then
            log_error "依赖安装失败"
            exit 1
        fi
    fi
}

# 检查环境文件
check_env_file() {
    if [ ! -f ".env" ]; then
        log_warning "未找到.env文件，将使用默认配置"
        log_info "如需自定义配置，请复制.env.example为.env并修改"
    fi
}

# 处理信号
cleanup() {
    log_info "正在关闭应用..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
    fi
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 主函数
main() {
    echo
    log_highlight "========================================"
    log_highlight "🚀 正在启动N8N Workflows应用..."
    log_highlight "========================================"
    echo
    
    check_nodejs
    check_project_files
    check_dependencies
    check_env_file
    
    # 启动应用
    log_info "正在启动服务器..."
    node scripts/start-unified.js &
    SERVER_PID=$!
    
    # 等待服务器启动
    wait $SERVER_PID
}

# 运行主函数
main