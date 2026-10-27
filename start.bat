@echo off
setlocal
cd /d "%~dp0"

set PORT=8000
set URL=http://localhost:%PORT%/

rem If the port is already listening, just open the browser.
netstat -an | findstr /r /c:":%PORT% .*LISTENING" >nul
if not errorlevel 1 (
    echo [info] Port %PORT% is already in use, opening browser.
    start "" "%URL%"
    timeout /t 3 >nul
    exit /b 0
)

where python >nul 2>nul
if not errorlevel 1 set PY=python
if not defined PY (
    where py >nul 2>nul
    if errorlevel 1 (
        echo [error] Python 3 not found. Please install it and add it to PATH.
        pause
        exit /b 1
    )
    set PY=py -3
)

echo Serving %URL%
echo Close this window to stop the server.
start "" "%URL%"
%PY% -m http.server %PORT%

echo.
echo Server stopped.
pause