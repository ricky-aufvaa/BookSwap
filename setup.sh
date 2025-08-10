#!/bin/bash

# BookSwap Setup Script
# This script sets up the BookSwap project for development

set -e  # Exit on any error

echo "🚀 BookSwap Setup Script"
echo "========================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) is installed"
}

# Get local IP address
get_local_ip() {
    print_status "Detecting local IP address..."
    
    # Try different methods to get local IP
    LOCAL_IP=""
    
    # Method 1: Using hostname -I (Linux)
    if command -v hostname &> /dev/null; then
        LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "")
    fi
    
    # Method 2: Using ifconfig (macOS/Linux)
    if [ -z "$LOCAL_IP" ] && command -v ifconfig &> /dev/null; then
        LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
    fi
    
    # Method 3: Using ip command (Linux)
    if [ -z "$LOCAL_IP" ] && command -v ip &> /dev/null; then
        LOCAL_IP=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'src \K\S+' || echo "")
    fi
    
    # Fallback
    if [ -z "$LOCAL_IP" ]; then
        LOCAL_IP="192.168.1.100"
        print_warning "Could not detect local IP. Using fallback: $LOCAL_IP"
        print_warning "You may need to update this manually in BookSwapMobile/src/config/index.ts"
    else
        print_success "Detected local IP: $LOCAL_IP"
    fi
}

# Update mobile app configuration
update_mobile_config() {
    print_status "Updating mobile app configuration..."
    
    CONFIG_FILE="BookSwapMobile/src/config/index.ts"
    
    if [ -f "$CONFIG_FILE" ]; then
        # Create backup
        cp "$CONFIG_FILE" "$CONFIG_FILE.backup"
        
        # Update the IP address in the config file
        sed -i.tmp "s/return '[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*';/return '$LOCAL_IP';/" "$CONFIG_FILE"
        rm "$CONFIG_FILE.tmp" 2>/dev/null || true
        
        print_success "Updated mobile app configuration with IP: $LOCAL_IP"
    else
        print_error "Mobile app configuration file not found: $CONFIG_FILE"
        exit 1
    fi
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    # Start database
    print_status "Starting database..."
    docker-compose up -d db
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Build and start backend
    print_status "Building and starting backend..."
    docker-compose up -d backend
    
    # Wait for backend to be ready
    print_status "Waiting for backend to be ready..."
    sleep 15
    
    # Run database migration
    print_status "Running database migration..."
    docker-compose exec backend python scripts/migrate_database.py || {
        print_warning "Database migration failed, but continuing..."
    }
    
    print_success "Backend setup completed"
}

# Setup mobile app
setup_mobile() {
    print_status "Setting up mobile app..."
    
    cd BookSwapMobile
    
    # Install dependencies
    print_status "Installing mobile app dependencies..."
    npm install
    
    print_success "Mobile app setup completed"
    cd ..
}

# Display final instructions
show_instructions() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo "================================"
    echo ""
    echo "📱 To start the mobile app:"
    echo "   cd BookSwapMobile"
    echo "   npm start"
    echo ""
    echo "🔧 Backend is running at: http://localhost:8000"
    echo "📚 API Documentation: http://localhost:8000/docs"
    echo ""
    echo "📱 Mobile app configuration:"
    echo "   - Android: http://$LOCAL_IP:8000/api/v1"
    echo "   - iOS: http://localhost:8000/api/v1"
    echo ""
    echo "🔍 If you have connection issues:"
    echo "   1. Check your firewall settings"
    echo "   2. Ensure your device and computer are on the same network"
    echo "   3. Update the IP address in BookSwapMobile/src/config/index.ts if needed"
    echo ""
    echo "🛠️  Useful commands:"
    echo "   - View backend logs: docker-compose logs backend"
    echo "   - View database logs: docker-compose logs db"
    echo "   - Stop services: docker-compose down"
    echo "   - Restart services: docker-compose restart"
    echo ""
    echo "📋 Features now available:"
    echo "   ✅ User authentication with city support"
    echo "   ✅ Book management (add/view personal books)"
    echo "   ✅ Google Books API integration"
    echo "   ✅ City-based book owner search"
    echo "   ✅ Real-time chat between users"
    echo "   ✅ Book exchange requests"
    echo ""
}

# Main setup process
main() {
    print_status "Starting BookSwap setup..."
    
    # Check prerequisites
    check_docker
    check_node
    
    # Get local IP
    get_local_ip
    
    # Update configurations
    update_mobile_config
    
    # Setup backend
    setup_backend
    
    # Setup mobile app
    setup_mobile
    
    # Show final instructions
    show_instructions
}

# Run main function
main "$@"
