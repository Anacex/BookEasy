#!/bin/bash

echo "🚀 Starting BookEasy Platform..."
echo

echo "📦 Installing dependencies..."
npm run install-all
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo
echo "🔧 Setting up environment files..."
if [ ! -f "server/.env" ]; then
    echo "Creating server/.env from template..."
    cp "server/env.example" "server/.env"
    echo "⚠️  Please edit server/.env with your configuration"
fi

if [ ! -f "client/.env" ]; then
    echo "Creating client/.env from template..."
    cp "client/env.example" "client/.env"
    echo "⚠️  Please edit client/.env with your configuration"
fi

echo
echo "🗄️  Starting MongoDB (if installed locally)..."
echo "Note: Make sure MongoDB is running or use MongoDB Atlas"
echo

echo "🌐 Starting development servers..."
echo "Backend will run on: http://localhost:5000"
echo "Frontend will run on: http://localhost:3000"
echo

npm run dev
