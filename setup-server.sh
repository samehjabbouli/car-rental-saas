#!/bin/bash
#
# Next.js Application Server Setup Script
# For use when SSH access is enabled on easy-cars.net
#
# Usage: ./setup-server.sh
#

set -e  # Exit on error

echo "========================================="
echo "Next.js Application Setup"
echo "========================================="
echo ""

# Navigate to application directory
APP_DIR="/home/easycars/nextjs-app"
echo "📁 Navigating to: $APP_DIR"
cd "$APP_DIR" || { echo "❌ Failed to navigate to $APP_DIR"; exit 1; }
echo "✅ Current directory: $(pwd)"
echo ""

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in $APP_DIR"
    echo "   Please ensure files are extracted correctly"
    exit 1
fi
echo "✅ package.json found"
echo ""

# Check Node.js version
echo "🔍 Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "✅ Node.js version: $NODE_VERSION"
    
    # Check if Node.js version is 18 or higher
    NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
        echo "⚠️  Warning: Node.js version $NODE_VERSION detected"
        echo "   Next.js 14 requires Node.js 18.x or higher"
        echo "   Please upgrade Node.js or use nvm to switch versions"
    fi
else
    echo "❌ Node.js not found"
    echo "   Please install Node.js 18.x or higher"
    exit 1
fi
echo ""

# Check npm
echo "🔍 Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo "✅ npm version: $NPM_VERSION"
else
    echo "❌ npm not found"
    exit 1
fi
echo ""

# Check environment variables
echo "🔍 Checking environment file..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local found"
    # Check if Supabase URL is present
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo "✅ Supabase configuration present"
    else
        echo "⚠️  Warning: NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
    fi
else
    echo "⚠️  Warning: .env.local not found"
    echo "   Creating .env.local with Supabase credentials..."
    cat > .env.local <<'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://dyesocyzpmyzxasmgxat.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5ZXNvY3l6cG15enhhc21neGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTE2ODgsImV4cCI6MjA5NDk4NzY4OH0.dYai4mJSAmuJL8It96eNVUxAGv25z8oQu0a2l-7Pnm8
EOF
    echo "✅ .env.local created"
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo "   This may take 2-5 minutes..."
npm install --production || { echo "❌ npm install failed"; exit 1; }
echo "✅ Dependencies installed successfully"
echo ""

# Check if production build exists
echo "🔍 Checking production build..."
if [ -d ".next" ]; then
    echo "✅ Production build found in .next directory"
else
    echo "⚠️  Warning: .next directory not found"
    echo "   Building application..."
    npm run build || { echo "❌ Build failed"; exit 1; }
    echo "✅ Build completed"
fi
echo ""

# Display application info
echo "========================================="
echo "🎉 Setup Complete!"
echo "========================================="
echo ""
echo "Application Location: $APP_DIR"
echo "Node.js Version: $NODE_VERSION"
echo "npm Version: $NPM_VERSION"
echo ""
echo "To start the application:"
echo "  Production mode:"
echo "    NODE_ENV=production PORT=3000 node server.js"
echo ""
echo "  Or use PM2 (recommended for production):"
echo "    npm install -g pm2"
echo "    pm2 start server.js --name easy-cars"
echo "    pm2 save"
echo "    pm2 startup"
echo ""
echo "Environment Variables:"
echo "  NODE_ENV=production"
echo "  PORT=3000"
echo "  NEXT_PUBLIC_SUPABASE_URL=(configured)"
echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=(configured)"
echo ""
echo "========================================="
