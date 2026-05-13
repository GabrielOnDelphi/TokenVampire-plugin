@echo off
REM ANSI escape stored as a real ESC byte. cmd.exe on Win10 1909+ honors VT sequences.
for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "GRAY=%ESC%[90m"
set "GREEN=%ESC%[32m"
set "RED=%ESC%[31m"
set "RESET=%ESC%[0m"

echo %GRAY%Installing ClaudeTokenVampire plugin...%RESET%
echo.
node "%~dp0setup.js" install
if errorlevel 1 (
    echo.
    echo %RED%Installation FAILED.%RESET%
    pause
    exit /b 1
)
echo.
echo %GRAY%Next step: run /reload-plugins in Claude Code%RESET%
pause
