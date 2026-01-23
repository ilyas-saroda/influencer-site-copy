@echo off
REM Frontend Startup Script - Influencer CRM Pro (Windows)
REM This script ensures all fixes are applied and starts the dev server

echo 🚀 Starting Influencer CRM Pro Frontend...
echo ==================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run from project root.
    pause
    exit /b 1
)

REM Step 1: Clear Vite cache
echo 🧹 Clearing Vite cache...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"

REM Step 2: Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
) else (
    echo ✅ Dependencies already installed
)

REM Step 3: Verify critical files exist
echo 🔍 Verifying critical files...

if exist "src\components\AppIcon.jsx" (echo ✅ src\components\AppIcon.jsx) else (echo ❌ Missing: src\components\AppIcon.jsx)
if exist "src\components\ui\Button.jsx" (echo ✅ src\components\ui\Button.jsx) else (echo ❌ Missing: src\components\ui\Button.jsx)
if exist "src\components\ui\Sidebar.jsx" (echo ✅ src\components\ui\Sidebar.jsx) else (echo ❌ Missing: src\components\ui\Sidebar.jsx)
if exist "src\components\ui\Header.jsx" (echo ✅ src\components\ui\Header.jsx) else (echo ❌ Missing: src\components\ui\Header.jsx)
if exist "src\components\ui\ToastContainer.jsx" (echo ✅ src\components\ui\ToastContainer.jsx) else (echo ❌ Missing: src\components\ui\ToastContainer.jsx)
if exist "src\services\adminControlService.js" (echo ✅ src\services\adminControlService.js) else (echo ❌ Missing: src\services\adminControlService.js)
if exist "src\pages\system-settings-user-management\index.jsx" (echo ✅ src\pages\system-settings-user-management\index.jsx) else (echo ❌ Missing: src\pages\system-settings-user-management\index.jsx)
if exist "src\pages\executive-dashboard\index.jsx" (echo ✅ src\pages\executive-dashboard\index.jsx) else (echo ❌ Missing: src\pages\executive-dashboard\index.jsx)

REM Step 4: Check environment variables
if exist ".env" (
    echo ✅ .env file found
) else (
    echo ⚠️  No .env file found - you may need to configure Supabase credentials
)

REM Step 5: Start development server
echo.
echo 🌟 Starting development server...
echo 📱 App will be available at: http://localhost:4000
echo 🔧 To stop: Press Ctrl+C
echo.

REM Start with force flag to clear any remaining cache issues
npm run dev -- --force
