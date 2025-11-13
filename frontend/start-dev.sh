#!/bin/bash

# Start both frontend and backend servers

echo "🚀 Starting KaNeXT IQ Development Servers..."
echo ""

# Start backend in background
echo "📦 Starting Backend Server (port 3001)..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "⚛️  Starting Frontend Server (port 3000)..."
npm start

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT

