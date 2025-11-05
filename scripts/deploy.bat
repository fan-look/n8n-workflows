@echo off
setlocal enableextensions

REM Windows 一键部署批处理脚本
REM 双击即可运行（默认 development 环境）

set PROJECT_DIR=%~dp0..
cd /d "%PROJECT_DIR%"

if "%1"=="" (
  set ENV=development
) else (
  set ENV=%1
)

echo [INFO] Running one-click deploy (env=%ENV%)
node scripts\one-click-deploy.js --env %ENV%

if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Deployment failed with code %ERRORLEVEL%
  pause
  exit /b %ERRORLEVEL%
)

echo [SUCCESS] Deployment finished.