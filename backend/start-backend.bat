@echo off
REM Batch script untuk menjalankan Toko Gerabah Backend di Windows
REM Author: Toko Gerabah Dev Team

echo.
echo ================================
echo  TOKO GERABAH - Backend Server
echo ================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js tidak terinstall!
    echo [INFO] Download dari https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js ditemukan
node --version

REM Check if npm dependencies installed
if not exist "node_modules" (
    echo.
    echo [INFO] Menginstall dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Gagal install dependencies
        pause
        exit /b 1
    )
)

echo.
echo [INFO] Menjalankan Backend Server...
echo [INFO] Akses di http://localhost:7777
echo [INFO] API Docs: http://localhost:7777/api-docs
echo [INFO] Tekan Ctrl+C untuk stop server
echo.

call npm start

pause
