@echo off
cd /d "%~dp0"
node scripts\demo.mjs setup
if errorlevel 1 (
  echo.
  echo Setup interrompido. Confira Docker Desktop, Node.js e a conexao com a internet.
  pause
  exit /b 1
)
node scripts\demo.mjs start --desktop
pause
