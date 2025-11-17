@echo off
REM N8N Workflows 统一启动脚本 (Windows)
REM 一键启动完整的应用（前端+后端一体化）

title N8N Workflows 启动器

:: 设置控制台颜色
color 0A

:: 检查Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 未检测到Node.js，请先安装Node.js 16.0.0或更高版本
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

:: 显示Node.js版本
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [INFO] Node.js版本: %NODE_VERSION%

:: 检查项目目录
cd /d "%~dp0\.."
echo [INFO] 项目目录: %cd%

:: 检查必需文件
if not exist "api\server.js" (
    echo [ERROR] 缺少服务器文件: api\server.js
    pause
    exit /b 1
)

if not exist "package.json" (
    echo [ERROR] 缺少项目配置文件: package.json
    pause
    exit /b 1
)

:: 检查依赖
if not exist "node_modules" (
    echo [WARNING] 未找到node_modules，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] 依赖安装失败
        pause
        exit /b 1
    )
)

:: 检查环境文件
if not exist ".env" (
    echo [WARNING] 未找到.env文件，将使用默认配置
    echo [INFO] 如需自定义配置，请复制.env.example为.env并修改
)

:: 启动应用
echo.
echo ========================================
echo 🚀 正在启动N8N Workflows应用...
echo ========================================
echo.

:: 使用统一启动脚本
node scripts\start-unified.js

:: 暂停查看错误信息（如果启动失败）
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] 应用启动失败，请检查错误信息
    pause
)

exit /b %errorlevel%