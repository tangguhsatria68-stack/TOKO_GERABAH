#!/bin/bash
# Script untuk menjalankan Toko Gerabah Frontend di macOS/Linux

echo ""
echo "================================"
echo "  TOKO GERABAH - Frontend App"
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
echo "[INFO] Menjalankan Frontend Development Server..."
echo "[INFO] Akses di http://localhost:3000"
echo "[INFO] Tekan Ctrl+C untuk stop server"
echo ""

npm start
