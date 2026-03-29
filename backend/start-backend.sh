#!/bin/bash
# Script untuk menjalankan Toko Gerabah Backend di macOS/Linux
# Author: Toko Gerabah Dev Team

echo ""
echo "================================"
echo "  TOKO GERABAH - Backend Server"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "[ERROR] Node.js tidak terinstall!"
    echo "[INFO] Download dari https://nodejs.org/"
    exit 1
fi

echo "[INFO] Node.js ditemukan"
node --version

# Check if npm dependencies installed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "[INFO] Menginstall dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Gagal install dependencies"
        exit 1
    fi
fi

echo ""
echo "[INFO] Menjalankan Backend Server..."
echo "[INFO] Akses di http://localhost:7777"
echo "[INFO] API Docs: http://localhost:7777/api-docs"
echo "[INFO] Tekan Ctrl+C untuk stop server"
echo ""

npm start
