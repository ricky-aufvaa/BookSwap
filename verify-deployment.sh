#!/bin/bash

# BookSwap Deployment Verification Script
# This script verifies that the deployed application is working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
REGION="us-central1"
SERVICE_NAME="bookswap-backend"

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

# Function to get project ID
get_project_id() {
    if [ -z "$PROJECT_ID" ]; then
        PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
        if [ -z "$PROJECT_ID" ]; then
            print_error "No project ID found. Please set it using: gcloud config set project YOUR_PROJECT_ID"
            exit 1
        fi
    fi
    print_status "Using project: $PROJECT_ID"
}

# Function to get service URL
get_service_url() {
    print_status "Getting service URL..."
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
        --platform managed \
        --region $REGION \
        --project=$PROJECT_ID \
        --format="value(status.url)" 2>/dev/null)
    
    if [ -z "$SERVICE_URL" ]; then
        print_error "Could not get service URL. Make sure the service is deployed."
        exit 1
    fi
    
    print_success "Service URL: $SERVICE_URL"
}

# Function to test health endpoint
test_health() {
    print_status "Testing health endpoint..."
    
    response=$(curl -s -w "%{http_code}" -o /tmp/health_response "$SERVICE_URL/health")
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        print_success "Health check passed (HTTP $http_code)"
        cat /tmp/health_response | python3 -m json.tool 2>/dev/null || cat /tmp/health_response
    else
        print_error "Health check failed (HTTP $http_code)"
        cat /tmp/health_response
        return 1
    fi
}

# Function to test root endpoint
test_root() {
    print_status "Testing root endpoint..."
    
    response=$(curl -s -w "%{http_code}" -o /tmp/root_response "$SERVICE_URL/")
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        print_success "Root endpoint test passed (HTTP $http_code)"
        cat /tmp/root_response | python3 -m json.tool 2>/dev/null || cat /tmp/root_response
    else
        print_error "Root endpoint test failed (HTTP $http_code)"
        cat /tmp/root_response
        return 1
    fi
}

# Function to test API endpoints
test_api_endpoints() {
    print_status "Testing API endpoints..."
    
    # Test signup endpoint (should return method not allowed for GET)
    response=$(curl -s -w "%{http_code}" -o /tmp/signup_response "$SERVICE_URL/api/v1/signup")
    http_code="${response: -3}"
    
    if [ "$http_code" = "405" ] || [ "$http_code" = "422" ]; then
        print_success "Signup endpoint is accessible (HTTP $http_code)"
    else
        print_warning "Signup endpoint returned unexpected status (HTTP $http_code)"
    fi
    
    # Test books endpoint (should require authentication)
    response=$(curl -s -w "%{http_code}" -o /tmp/books_response "$SERVICE_URL/api/v1/books/")
    http_code="${response: -3}"
    
    if [ "$http_code" = "401" ]; then
        print_success "Books endpoint requires authentication (HTTP $http_code)"
    else
        print_warning "Books endpoint returned unexpected status (HTTP $http_code)"
    fi
}

# Function to check database connectivity
test_database() {
    print_status "Testing database connectivity..."
    
    # Try to access an endpoint that requires database
    response=$(curl -s -w "%{http_code}" -o /tmp/db_response -X POST \
        -H "Content-Type: application/json" \
        -d '{"username":"test","email":"test@example.com","password":"test123","city":"TestCity"}' \
        "$SERVICE_URL/api/v1/signup")
    http_code="${response: -3}"
    
    if [ "$http_code" = "400" ] || [ "$http_code" = "422" ] || [ "$http_code" = "409" ]; then
        print_success "Database connectivity test passed (HTTP $http_code)"
    else
        print_warning "Database test returned status (HTTP $http_code)"
        cat /tmp/db_response
    fi
}

# Function to check Cloud SQL instance
check_cloud_sql() {
    print_status "Checking Cloud SQL instance..."
    
    DB_STATUS=$(gcloud sql instances describe bookswap-db \
        --project=$PROJECT_ID \
        --format="value(state)" 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$DB_STATUS" = "RUNNABLE" ]; then
        print_success "Cloud SQL instance is running"
    else
        print_error "Cloud SQL instance status: $DB_STATUS"
        return 1
    fi
}

# Function to check secrets
check_secrets() {
    print_status "Checking secrets..."
    
    secrets=("bookswap-database-url" "bookswap-secret-key" "bookswap-google-api-key")
    
    for secret in "${secrets[@]}"; do
        if gcloud secrets describe "$secret" --project=$PROJECT_ID &>/dev/null; then
            print_success "Secret '$secret' exists"
        else
            print_error "Secret '$secret' not found"
        fi
    done
}

# Function to run performance test
performance_test() {
    print_status "Running basic performance test..."
    
    start_time=$(date +%s.%N)
    response=$(curl -s -w "%{http_code}" -o /dev/null "$SERVICE_URL/health")
    end_time=$(date +%s.%N)
    
    duration=$(echo "$end_time - $start_time" | bc)
    
    if (( $(echo "$duration < 2.0" | bc -l) )); then
        print_success "Response time: ${duration}s (Good)"
    elif (( $(echo "$duration < 5.0" | bc -l) )); then
        print_warning "Response time: ${duration}s (Acceptable)"
    else
        print_error "Response time: ${duration}s (Slow)"
    fi
}

# Main verification function
main() {
    print_status "Starting BookSwap deployment verification..."
    echo ""
    
    get_project_id
    get_service_url
    
    echo ""
    print_status "=== Running Tests ==="
    
    # Basic connectivity tests
    test_health
    echo ""
    
    test_root
    echo ""
    
    test_api_endpoints
    echo ""
    
    # Infrastructure tests
    check_cloud_sql
    echo ""
    
    check_secrets
    echo ""
    
    test_database
    echo ""
    
    performance_test
    echo ""
    
    print_success "=== Verification Complete ==="
    echo ""
    echo "Service URL: $SERVICE_URL"
    echo "API Base URL: $SERVICE_URL/api/v1"
    echo "Health Check: $SERVICE_URL/health"
    echo "API Documentation: $SERVICE_URL/docs (if in development mode)"
    echo ""
    echo "Next steps:"
    echo "1. Update your mobile app configuration with: $SERVICE_URL/api/v1"
    echo "2. Test the mobile app with the deployed backend"
    echo "3. Set up monitoring and alerting"
    echo "4. Configure custom domain (optional)"
    
    # Clean up temp files
    rm -f /tmp/health_response /tmp/root_response /tmp/signup_response /tmp/books_response /tmp/db_response
}

# Check if curl is available
if ! command -v curl &> /dev/null; then
    print_error "curl is required but not installed. Please install curl."
    exit 1
fi

# Check if bc is available for performance test
if ! command -v bc &> /dev/null; then
    print_warning "bc is not installed. Performance test will be skipped."
    performance_test() {
        print_warning "Performance test skipped (bc not available)"
    }
fi

# Run the main function
main "$@"
