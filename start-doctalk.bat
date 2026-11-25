@echo off
setlocal

cd /d "%~dp0"

echo Starting DockTalk server...
node server.js

endlocal
