#!/bin/bash

# Frontend Startup Script - Influencer CRM Pro
# This script ensures all fixes are applied and starts the dev server

echo "🚀 Starting Influencer CRM Pro Frontend..."
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from project root."
    exit 1
fi

# Step 1: Clear Vite cache
echo "🧹 Clearing Vite cache..."
rm -rf node_modules/.vite 2>/dev/null || true

# Step 2: Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Step 3: Verify critical files exist
echo "🔍 Verifying critical files..."

CRITICAL_FILES=(
    "src/components/AppIcon.jsx"
    "src/components/ui/Button.jsx"
    "src/components/ui/Sidebar.jsx"
    "src/components/ui/Header.jsx"
    "src/components/ui/ToastContainer.jsx"
    "src/services/adminControlService.js"
    "src/pages/system-settings-user-management/index.jsx"
    "src/pages/executive-dashboard/index.jsx"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
    fi
done

# Step 4: Check environment variables
if [ -f ".env" ]; then
    echo "✅ .env file found"
else
    echo "⚠️  No .env file found - you may need to configure Supabase credentials"
fi

# Step 5: Start development server
echo ""
echo "🌟 Starting development server..."
echo "📱 App will be available at: http://localhost:4000"
echo "🔧 To stop: Press Ctrl+C"
echo ""

# Start with force flag to clear any remaining cache issues
npm run dev -- --force
