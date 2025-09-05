@echo off
echo 🚀 Starting BookEasy Platform...
echo.

echo 📦 Installing dependencies...
call npm run install-all
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 🔧 Setting up environment files...
if not exist "server\.env" (
    echo Creating server/.env from template...
    copy "server\env.example" "server\.env"
    echo ⚠️  Please edit server/.env with your configuration
)

if not exist "client\.env" (
    echo Creating client/.env from template...
    copy "client\env.example" "client\.env"
    echo ⚠️  Please edit client/.env with your configuration
)

echo.
echo 🗄️  Starting MongoDB (if installed locally)...
echo Note: Make sure MongoDB is running or use MongoDB Atlas
echo.

echo 🌐 Starting development servers...
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:3000
echo.

call npm run dev
