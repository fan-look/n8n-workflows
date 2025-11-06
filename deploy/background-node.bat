@echo off
setlocal enableextensions

REM 简易后台运行包装脚本（调用 PowerShell）
REM 用法：background-node.bat [start|stop|status|logs]

set SCRIPT_DIR=%~dp0
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%background-node.ps1" %*