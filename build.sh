#!/bin/bash

# Build script for BookSwap API deployment on Render

echo "Starting build process for BookSwap API..."

# Navigate to backend directory
cd backend

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run any database migrations or setup if needed
echo "Setting up database..."
# Note: Database tables will be created automatically on startup via SQLAlchemy

echo "Build process completed successfully!"
