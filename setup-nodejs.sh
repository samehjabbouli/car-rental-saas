#!/bin/bash
# Easy Cars - Node.js Application Setup Script
# Run this script after manually setting up the Node.js app in cPanel

echo "=========================================="
echo "Easy Cars - Node.js Application Setup"
echo "=========================================="
echo ""

# Navigate to app directory
cd /home/easycars/nextjs-app

echo "[1/5] Checking Node.js version..."
node --version
npm --version
echo ""

echo "[2/5] Installing dependencies (this may take a few minutes)..."
npm install --production=false
echo ""

echo "[3/5] Building application..."
npm run build
echo ""

echo "[4/5] Starting application..."
# Use PM2 for process management
pm2 start server.js --name "easy-cars" || node server.js &
echo ""

echo "[5/5] Checking status..."
sleep 3
pm2 status || ps aux | grep node
echo ""

echo "=========================================="
echo "Setup complete!"
echo "Application should be accessible at:"
echo "https://easy-cars.net"
echo "=========================================="