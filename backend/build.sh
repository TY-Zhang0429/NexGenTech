#!/bin/bash
# Build script for Render deployment

echo "Installing frontend dependencies..."
cd ..
npm install

echo "Building frontend..."
npm run build

echo "Build complete. Checking if dist folder exists..."
ls -la dist/

echo "Checking if index.html exists..."
ls -la dist/index.html
