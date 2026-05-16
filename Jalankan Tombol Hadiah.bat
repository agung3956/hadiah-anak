@echo off
setlocal
cd /d "%~dp0"
set PORT=4190
start "Tombol Hadiah Backend" /min cmd /c "node server.js"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:%PORT%/"
endlocal
