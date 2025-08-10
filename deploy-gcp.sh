#!/bin/bash

# BookSwap GCP Deployment Script
# This script deploys the BookSwap application to Google Cloud Platform

set -e  # Exit on any error

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
DB_INSTANCE_NAME="bookswap-db"
DB_NAME="bookswap"
DB_USER="postgres"

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

# Function to check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it from https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to get project ID
get_project_id() {
    if [ -z "$PROJECT_ID" ]; then
        print_status "Getting current project ID..."
        PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
        
        if [ -z "$PROJECT_ID" ]; then
            print_error "No project ID found. Please set it using: gcloud config set project YOUR_PROJECT_ID"
            exit 1
        fi
    fi
    
    print_success "Using project: $PROJECT_ID"
}

# Function to enable required APIs
enable_apis() {
    print_status "Enabling required Google Cloud APIs..."
    
    gcloud services enable cloudbuild.googleapis.com \
        run.googleapis.com \
        sql-component.googleapis.com \
        sqladmin.googleapis.com \
        secretmanager.googleapis.com \
        --project=$PROJECT_ID
    
    print_success "APIs enabled successfully"
}

# Function to create Cloud SQL instance
create_database() {
    print_status "Creating Cloud SQL instance..."
    
    # Check if instance already exists
    if gcloud sql instances describe $DB_INSTANCE_NAME --project=$PROJECT_ID &>/dev/null; then
        print_warning "Cloud SQL instance $DB_INSTANCE_NAME already exists"
    else
        # Generate a random password
        DB_PASSWORD=$(openssl rand -base64 32)
        
        gcloud sql instances create $DB_INSTANCE_NAME \
            --database-version=POSTGRES_15 \
            --tier=db-f1-micro \
            --region=$REGION \
            --project=$PROJECT_ID
        
        # Set the postgres user password
        gcloud sql users set-password $DB_USER \
            --instance=$DB_INSTANCE_NAME \
            --password=$DB_PASSWORD \
            --project=$PROJECT_ID
        
        # Create the database
        gcloud sql databases create $DB_NAME \
            --instance=$DB_INSTANCE_NAME \
            --project=$PROJECT_ID
        
        print_success "Cloud SQL instance created successfully"
        print_status "Database password: $DB_PASSWORD"
        print_warning "Please save this password securely!"
        
        # Store password in Secret Manager
        echo -n "$DB_PASSWORD" | gcloud secrets create db-password \
            --data-file=- \
            --project=$PROJECT_ID || true
    fi
}

# Function to create secrets
create_secrets() {
    print_status "Creating secrets in Secret Manager..."
    
    # Get database connection string
    DB_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME \
        --project=$PROJECT_ID \
        --format="value(connectionName)")
    
    # Get database password
    if gcloud secrets describe db-password --project=$PROJECT_ID &>/dev/null; then
        DB_PASSWORD=$(gcloud secrets versions access latest --secret="db-password" --project=$PROJECT_ID)
    else
        print_error "Database password secret not found. Please create the database first."
        exit 1
    fi
    
    # Create DATABASE_URL secret
    DATABASE_URL="postgresql+asyncpg://$DB_USER:$DB_PASSWORD@/$DB_NAME?host=/cloudsql/$DB_CONNECTION_NAME"
    echo -n "$DATABASE_URL" | gcloud secrets create bookswap-database-url \
        --data-file=- \
        --project=$PROJECT_ID || \
    echo -n "$DATABASE_URL" | gcloud secrets versions add bookswap-database-url \
        --data-file=- \
        --project=$PROJECT_ID
    
    # Create SECRET_KEY secret
    SECRET_KEY=$(openssl rand -base64 32)
    echo -n "$SECRET_KEY" | gcloud secrets create bookswap-secret-key \
        --data-file=- \
        --project=$PROJECT_ID || \
    echo -n "$SECRET_KEY" | gcloud secrets versions add bookswap-secret-key \
        --data-file=- \
        --project=$PROJECT_ID
    
    # Create GOOGLE_BOOKS_API_KEY secret (using the existing one from .env)
    if [ -f "backend/config/.env" ]; then
        GOOGLE_API_KEY=$(grep GOOGLE_BOOKS_API_KEY backend/config/.env | cut -d '=' -f2)
        echo -n "$GOOGLE_API_KEY" | gcloud secrets create bookswap-google-api-key \
            --data-file=- \
            --project=$PROJECT_ID || \
        echo -n "$GOOGLE_API_KEY" | gcloud secrets versions add bookswap-google-api-key \
            --data-file=- \
            --project=$PROJECT_ID
    fi
    
    print_success "Secrets created successfully"
}

# Function to build and push Docker image
build_and_push_image() {
    print_status "Building and pushing Docker image..."
    
    # Configure Docker to use gcloud as a credential helper
    gcloud auth configure-docker --project=$PROJECT_ID
    
    # Build the image
    cd backend
    docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest .
    
    # Push the image
    docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest
    
    cd ..
    print_success "Docker image built and pushed successfully"
}

# Function to deploy to Cloud Run
deploy_to_cloud_run() {
    print_status "Deploying to Cloud Run..."
    
    # Get database connection name
    DB_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME \
        --project=$PROJECT_ID \
        --format="value(connectionName)")
    
    gcloud run deploy $SERVICE_NAME \
        --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --set-env-vars ENVIRONMENT=production \
        --set-secrets DATABASE_URL=bookswap-database-url:latest \
        --set-secrets SECRET_KEY=bookswap-secret-key:latest \
        --set-secrets GOOGLE_BOOKS_API_KEY=bookswap-google-api-key:latest \
        --add-cloudsql-instances $DB_CONNECTION_NAME \
        --memory 512Mi \
        --cpu 1 \
        --timeout 300 \
        --concurrency 100 \
        --project=$PROJECT_ID
    
    # Get the service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
        --platform managed \
        --region $REGION \
        --project=$PROJECT_ID \
        --format="value(status.url)")
    
    print_success "Application deployed successfully!"
    print_success "Service URL: $SERVICE_URL"
}

# Function to update mobile app configuration
update_mobile_config() {
    print_status "Updating mobile app configuration..."
    
    # Get the service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
        --platform managed \
        --region $REGION \
        --project=$PROJECT_ID \
        --format="value(status.url)")
    
    if [ ! -z "$SERVICE_URL" ]; then
        # Update the mobile app configuration with the production URL
        sed -i.bak "s|API_BASE_URL: 'https://your-service-url.run.app/api/v1'|API_BASE_URL: '${SERVICE_URL}/api/v1'|g" BookSwapMobile/src/config/index.ts
        
        print_success "Mobile app configuration updated"
        print_status "Production API URL: ${SERVICE_URL}/api/v1"
        print_warning "Please rebuild your mobile app to use the new production URL"
        
        # Create a backup of the original config
        cp BookSwapMobile/src/config/index.ts BookSwapMobile/src/config/index.production.ts
    fi
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # This would typically run your database migration scripts
    # For now, we'll just note that the database tables will be created on first startup
    print_warning "Database tables will be created automatically on first application startup"
    print_status "If you have migration scripts, run them manually after deployment"
}

# Main deployment function
main() {
    print_status "Starting BookSwap GCP deployment..."
    
    check_prerequisites
    get_project_id
    enable_apis
    create_database
    create_secrets
    build_and_push_image
    deploy_to_cloud_run
    run_migrations
    update_mobile_config
    
    print_success "Deployment completed successfully!"
    print_status "Your BookSwap backend is now running on Google Cloud Platform"
    
    # Get final service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
        --platform managed \
        --region $REGION \
        --project=$PROJECT_ID \
        --format="value(status.url)" 2>/dev/null || echo "Unable to get service URL")
    
    echo ""
    echo "=== Deployment Summary ==="
    echo "Project ID: $PROJECT_ID"
    echo "Service Name: $SERVICE_NAME"
    echo "Region: $REGION"
    echo "Service URL: $SERVICE_URL"
    echo "Database Instance: $DB_INSTANCE_NAME"
    echo ""
    echo "Next steps:"
    echo "1. Test your API at: $SERVICE_URL"
    echo "2. Update your mobile app to use: $SERVICE_URL/api/v1"
    echo "3. Configure your domain (optional)"
    echo "4. Set up monitoring and logging"
}

# Run the main function
main "$@"
