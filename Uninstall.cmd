@echo off
for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "GRAY=%ESC%[90m"
set "GREEN=%ESC%[32m"
set "RED=%ESC%[31m"
set "RESET=%ESC%[0m"

echo %GRAY%Uninstalling ClaudeTokenVampire plugin...%RESET%
echo.
node "%~dp0setup.js" uninstall
if errorlevel 1 (
    echo.
    echo %RED%Uninstall FAILED.%RESET%
    pause
    exit /b 1
)
echo.
echo %GRAY%Next step: run /reload-plugins in Claude Code%RESET%
pause
