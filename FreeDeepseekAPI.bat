@echo off
where node >nul 2>nul || (
  echo Node.js 18+ is required but not found in PATH.
  echo Download from https://nodejs.org/
  pause
  exit /b 1
)
node "%~dp0launcher.js" %*
if errorlevel 1 pause
