#!/bin/bash
# Easy Cars - Automated Deployment Script
# Run this from the car-rental-saas directory

echo "=========================================="
echo "Easy Cars SaaS - Deployment Script"
echo "=========================================="

# Configuration
HOST="easy-cars.net"
USER="easycars"
REMOTE_DIR="public_html"
PORT=22

# Check if .next folder exists
if [ ! -d ".next" ]; then
    echo "❌ Error: .next folder not found!"
    echo "Please run this script from the car-rental-saas directory"
    exit 1
fi

echo "✓ Deployment package verified"

# Create .env.local if not exists
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local..."
    cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://dyesocyzpmyzxasmgxat.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5ZXNvY3l6cG15enhhc21neGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTE2ODgsImV4cCI6MjA5NDk4NzY4OH0.dYai4mJSAmuJL8It96eNVUxAGv25z8oQu0a2l-7Pnm8
EOF
    echo "✓ .env.local created"
fi

# Create deployment package
echo ""
echo "Creating deployment package..."
zip -r easy-cars-ready.zip .next package.json package-lock.json server.js .env.local .env.example 2>/dev/null
echo "✓ Package created: easy-cars-ready.zip"

echo ""
echo "=========================================="
echo "Deployment package ready!"
echo ""
echo "To deploy to cPanel:"
echo "1. Download easy-cars-ready.zip"
echo "2. Login to https://easy-cars.net:2083"
echo "3. Go to File Manager → public_html"
echo "4. Upload easy-cars-ready.zip and extract"
echo "5. Open Terminal and run:"
echo "   cd ~/public_html"
echo "   npm install"
echo "   node server.js &"
echo ""
echo "Or if you have SSH access enabled:"
echo "   scp -r .next package.json server.js easycars@easy-cars.net:~/public_html/"
echo "=========================================="