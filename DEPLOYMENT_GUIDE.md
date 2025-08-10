# BookSwap GCP Deployment Guide

This guide will help you deploy the BookSwap application to Google Cloud Platform (GCP).

## Prerequisites

Before deploying, ensure you have:

1. **Google Cloud Account**: Sign up at [cloud.google.com](https://cloud.google.com)
2. **Google Cloud Project**: Create a new project or use an existing one
3. **Google Cloud SDK**: Install from [cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install)
4. **Docker**: Install from [docker.com](https://www.docker.com/get-started)
5. **Billing Account**: Enable billing for your GCP project

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

1. **Authenticate with Google Cloud**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Run the deployment script**:
   ```bash
   ./deploy-gcp.sh
   ```

The script will automatically:
- Enable required GCP APIs
- Create a PostgreSQL database
- Set up secrets management
- Build and deploy the Docker container
- Configure Cloud Run service
- Update mobile app configuration

### Option 2: Manual Deployment

If you prefer manual control, follow these steps:

#### 1. Set up Google Cloud Project

```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com sql-component.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com
```

#### 2. Create Cloud SQL Database

```bash
# Create PostgreSQL instance
gcloud sql instances create bookswap-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1

# Set password for postgres user
gcloud sql users set-password postgres \
    --instance=bookswap-db \
    --password=YOUR_SECURE_PASSWORD

# Create database
gcloud sql databases create bookswap --instance=bookswap-db
```

#### 3. Create Secrets

```bash
# Create secrets for sensitive data
echo -n "your-secret-key" | gcloud secrets create bookswap-secret-key --data-file=-
echo -n "your-google-books-api-key" | gcloud secrets create bookswap-google-api-key --data-file=-
echo -n "postgresql+asyncpg://postgres:PASSWORD@/bookswap?host=/cloudsql/PROJECT:REGION:INSTANCE" | gcloud secrets create bookswap-database-url --data-file=-
```

#### 4. Build and Deploy

```bash
# Build Docker image
cd backend
docker build -t gcr.io/$PROJECT_ID/bookswap-backend:latest .

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/bookswap-backend:latest

# Deploy to Cloud Run
gcloud run deploy bookswap-backend \
    --image gcr.io/$PROJECT_ID/bookswap-backend:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars ENVIRONMENT=production \
    --set-secrets DATABASE_URL=bookswap-database-url:latest \
    --set-secrets SECRET_KEY=bookswap-secret-key:latest \
    --set-secrets GOOGLE_BOOKS_API_KEY=bookswap-google-api-key:latest \
    --add-cloudsql-instances PROJECT:REGION:INSTANCE \
    --memory 512Mi
```

## Configuration

### Environment Variables

The application uses these environment variables in production:

- `ENVIRONMENT`: Set to "production"
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `GOOGLE_BOOKS_API_KEY`: Google Books API key
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time (default: 30)

### Mobile App Configuration

After deployment, update your mobile app's API configuration:

1. The deployment script creates `BookSwapMobile/src/config/production.ts`
2. Update your app to use this configuration in production builds
3. The API base URL will be your Cloud Run service URL + `/api/v1`

## Post-Deployment

### 1. Test Your API

Visit your Cloud Run service URL to test the API:
- `GET /` - Health check
- `GET /docs` - API documentation
- `POST /api/v1/signup` - User registration
- `POST /api/v1/login` - User login

### 2. Update Mobile App

Update your React Native app to point to the production API:

```typescript
// In your API service file
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api/v1'  // Development
  : 'https://your-service-url.run.app/api/v1';  // Production
```

### 3. Set Up Custom Domain (Optional)

```bash
# Map custom domain to Cloud Run service
gcloud run domain-mappings create \
    --service bookswap-backend \
    --domain your-domain.com \
    --region us-central1
```

### 4. Configure Monitoring

Set up monitoring and alerting:
- Enable Cloud Monitoring
- Set up uptime checks
- Configure error reporting
- Set up log-based metrics

## Costs

Estimated monthly costs for small-scale usage:

- **Cloud Run**: ~$0-10 (pay per request)
- **Cloud SQL**: ~$7-15 (db-f1-micro instance)
- **Container Registry**: ~$0-5 (storage costs)
- **Secret Manager**: ~$0-1 (API calls)

**Total**: ~$7-31/month for light usage

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

2. **Permission Errors**:
   - Ensure billing is enabled
   - Check IAM permissions
   - Enable required APIs

3. **Database Connection Issues**:
   - Verify Cloud SQL instance is running
   - Check connection string format
   - Ensure Cloud SQL connector is configured

4. **Build Failures**:
   - Check Dockerfile syntax
   - Verify all dependencies in requirements.txt
   - Ensure Docker daemon is running

### Logs and Debugging

```bash
# View Cloud Run logs
gcloud logs read --service=bookswap-backend --limit=50

# View Cloud SQL logs
gcloud sql operations list --instance=bookswap-db

# Debug Cloud Run service
gcloud run services describe bookswap-backend --region=us-central1
```

## Security Best Practices

1. **Use Secret Manager** for sensitive data
2. **Enable VPC** for database security
3. **Set up IAM roles** with least privilege
4. **Enable audit logging**
5. **Use HTTPS** for all communications
6. **Regular security updates**

## Scaling

The current configuration supports:
- **Automatic scaling** based on traffic
- **Concurrent requests**: Up to 100 per instance
- **Memory**: 512Mi per instance
- **CPU**: 1 vCPU per instance

To handle more traffic, adjust these settings in the deployment script or Cloud Run console.

## Support

For issues:
1. Check the troubleshooting section above
2. Review Cloud Run and Cloud SQL logs
3. Consult Google Cloud documentation
4. Check the application logs for specific errors

## Next Steps

After successful deployment:
1. Set up CI/CD pipeline for automated deployments
2. Configure monitoring and alerting
3. Set up staging environment
4. Implement backup strategies
5. Plan for disaster recovery
