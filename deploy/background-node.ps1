param(
  [ValidateSet('start','stop','status','logs')]
  [string]$Action = 'status'
)

$ProjectDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$NodePath = 'node'
$ScriptPath = Join-Path $ProjectDir 'api\server.js'
$LogsDir = Join-Path $ProjectDir 'logs'
$StdOut = Join-Path $LogsDir 'background-out.log'
$StdErr = Join-Path $LogsDir 'background-error.log'
$PidFile = Join-Path $PSScriptRoot 'background.pid'

New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null

function Get-RunningPid {
  if (Test-Path $PidFile) {
    try {
      $pid = Get-Content $PidFile | Select-Object -First 1
      if ($pid -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) { return [int]$pid }
    } catch {}
  }
  return $null
}

switch ($Action.ToLower()) {
  'start' {
    $runningPid = Get-RunningPid
    if ($runningPid) {
      Write-Host "[INFO] 后台进程已运行 (PID=$runningPid)" -ForegroundColor Yellow
      break
    }
    Write-Host "[INFO] 正在后台启动 Node 服务..." -ForegroundColor Cyan
    $p = Start-Process -FilePath $NodePath -ArgumentList $ScriptPath -WorkingDirectory $ProjectDir -WindowStyle Hidden -RedirectStandardOutput $StdOut -RedirectStandardError $StdErr -PassThru
    if ($p -and $p.Id) {
      Set-Content -Path $PidFile -Value $p.Id
      Write-Host "[SUCCESS] 已启动后台进程 (PID=$($p.Id))" -ForegroundColor Green
      Write-Host "[INFO] 日志: $StdOut | $StdErr"
    } else {
      Write-Host "[ERROR] 启动失败" -ForegroundColor Red
      exit 1
    }
  }
  'stop' {
    $runningPid = Get-RunningPid
    if ($runningPid) {
      Write-Host "[INFO] 停止进程 (PID=$runningPid)" -ForegroundColor Cyan
      Stop-Process -Id $runningPid -Force -ErrorAction SilentlyContinue
      Remove-Item -Path $PidFile -Force -ErrorAction SilentlyContinue
      Write-Host "[SUCCESS] 已停止后台进程" -ForegroundColor Green
    } else {
      Write-Host "[WARN] 未发现运行中的后台进程" -ForegroundColor Yellow
    }
  }
  'status' {
    $runningPid = Get-RunningPid
    if ($runningPid) {
      Write-Host "[STATUS] 运行中 (PID=$runningPid)" -ForegroundColor Green
      Write-Host "[INFO] 日志: $StdOut"
    } else {
      Write-Host "[STATUS] 未运行" -ForegroundColor Yellow
    }
  }
  'logs' {
    Write-Host "[INFO] 显示后台进程标准输出 (Ctrl+C 退出): $StdOut" -ForegroundColor Cyan
    if (!(Test-Path $StdOut)) { New-Item -ItemType File -Path $StdOut -Force | Out-Null }
    Get-Content -Path $StdOut -Wait -Tail 200
  }
  default {
    Write-Host "用法: background-node.ps1 [start|stop|status|logs]" -ForegroundColor Yellow
    exit 1
  }
}