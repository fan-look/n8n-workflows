@echo off
setlocal enableextensions

REM PM2 管理脚本（Windows）
REM 用法：pm2-manage.bat [start|stop|restart|status|logs] [env]
REM 例如：pm2-manage.bat start development

set PROJECT_DIR=%~dp0..
cd /d "%PROJECT_DIR%"

if "%1"=="" (
  set ACTION=status
) else (
  set ACTION=%1
)

if "%2"=="" (
  set ENV=development
) else (
  set ENV=%2
)

REM 检查是否安装 pm2
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [INFO] PM2 未安装，正在全局安装...
  call npm install -g pm2
)

REM 确保日志目录存在
if not exist "%PROJECT_DIR%\logs" (
  mkdir "%PROJECT_DIR%\logs"
)

if /I "%ACTION%"=="start" (
  echo [INFO] 启动 PM2 进程 (env=%ENV%)
  pm2 start ecosystem.config.js --env %ENV%
  pm2 save
  goto :EOF
)

if /I "%ACTION%"=="stop" (
  echo [INFO] 停止 PM2 进程
  pm2 stop n8n-workflows-api
  pm2 save
  goto :EOF
)

if /I "%ACTION%"=="restart" (
  echo [INFO] 重启 PM2 进程
  pm2 restart n8n-workflows-api --update-env
  pm2 save
  goto :EOF
)

if /I "%ACTION%"=="status" (
  echo [INFO] 查看 PM2 进程状态
  pm2 status n8n-workflows-api
  goto :EOF
)

if /I "%ACTION%"=="logs" (
  echo [INFO] 查看 PM2 日志（按 Ctrl+C 退出）
  pm2 logs n8n-workflows-api
  goto :EOF
)

echo [ERROR] 不支持的操作：%ACTION%
echo 用法：pm2-manage.bat [start|stop|restart|status|logs] [env]
exit /b 1