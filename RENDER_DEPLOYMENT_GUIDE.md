# BookSwap API - Render Deployment Guide

This guide will help you deploy the BookSwap FastAPI application to Render.

## Prerequisites

1. A Render account (sign up at [render.com](https://render.com))
2. Your code pushed to a GitHub repository
3. Environment variables ready

## Deployment Options

### Option 1: Using render.yaml (Recommended)

1. **Connect Repository**
   - Go to your Render dashboard
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

2. **Configure Environment Variables**
   The following environment variables will be set automatically via render.yaml:
   - `ENVIRONMENT=production`
   - `HOST=0.0.0.0`
   - `PORT` (automatically assigned by Render)
   - `DATABASE_URL` (from the PostgreSQL database)
   - `SECRET_KEY` (auto-generated)
   - `ALGORITHM=HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES=30`

   **Manual Configuration Required:**
   - `GOOGLE_BOOKS_API_KEY`: Set this in the Render dashboard
   - `ALLOWED_ORIGINS`: Update with your frontend URLs

### Option 2: Manual Setup

1. **Create Web Service**
   - Go to Render dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure the following:

2. **Build & Deploy Settings**
   ```
   Name: bookswap-api
   Environment: Python 3
   Region: Singapore (or your preferred region)
   Branch: main (or your deployment branch)
   Root Directory: (leave empty)
   Build Command: cd backend && pip install -r requirements.txt
   Start Command: cd backend && python start.py
   ```

3. **Environment Variables**
   Add these in the Render dashboard:
   ```
   ENVIRONMENT=production
   HOST=0.0.0.0
   DATABASE_URL=<your_postgresql_connection_string>
   SECRET_KEY=<generate_a_secure_secret_key>
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   GOOGLE_BOOKS_API_KEY=<your_google_books_api_key>
   ALLOWED_ORIGINS=<your_frontend_urls_comma_separated>
   ```

4. **Create PostgreSQL Database**
   - In Render dashboard, click "New" → "PostgreSQL"
   - Configure:
     ```
     Name: bookswap-db
     Database Name: bookswap
     User: bookswap_user
     Region: Singapore (same as web service)
     ```
   - Copy the connection string to `DATABASE_URL` environment variable

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `ENVIRONMENT` | Application environment | `production` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port (auto-assigned by Render) | `10000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://user:pass@host:5432/db` |
| `SECRET_KEY` | JWT secret key | `your-super-secret-key-here` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | `30` |
| `GOOGLE_BOOKS_API_KEY` | Google Books API key | `AIzaSy...` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `https://yourapp.com,https://www.yourapp.com` |

## Database Setup

The application will automatically create database tables on startup using SQLAlchemy. No manual migration is required for the initial deployment.

## Health Check

The application includes a health check endpoint at `/health` that Render will use to monitor the service.

## API Documentation

- **Development**: Available at `/docs` and `/redoc`
- **Production**: Documentation is disabled for security

## Monitoring and Logs

1. **Logs**: View real-time logs in the Render dashboard
2. **Metrics**: Monitor CPU, memory, and response times
3. **Health Checks**: Automatic health monitoring via `/health` endpoint

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that `requirements.txt` is in the `backend/` directory
   - Ensure all dependencies are properly listed
   - Verify Python version compatibility

2. **Database Connection Issues**
   - Verify `DATABASE_URL` is correctly set
   - Ensure the PostgreSQL service is running
   - Check that the connection string format is correct

3. **Environment Variable Issues**
   - Verify all required environment variables are set
   - Check for typos in variable names
   - Ensure sensitive values are properly configured

4. **CORS Issues**
   - Update `ALLOWED_ORIGINS` with your frontend URLs
   - Remove `*` from allowed origins in production for security

### Debugging Steps

1. Check the deployment logs in Render dashboard
2. Verify environment variables are set correctly
3. Test the health check endpoint: `https://your-app.onrender.com/health`
4. Check database connectivity and table creation

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **CORS**: Configure specific origins instead of using `*` in production
3. **Secret Key**: Use a strong, randomly generated secret key
4. **Database**: Use strong passwords and restrict access
5. **API Documentation**: Disabled in production for security

## Scaling

Render automatically handles:
- Load balancing
- SSL certificates
- CDN integration
- Auto-scaling (on paid plans)

## Cost Optimization

1. **Free Tier**: Use free tier for development/testing
2. **Starter Plan**: Recommended for production
3. **Database**: Start with the free PostgreSQL tier
4. **Monitoring**: Use Render's built-in monitoring to optimize resource usage

## Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **FastAPI Documentation**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- **Project Issues**: Create issues in your GitHub repository

## Next Steps After Deployment

1. Test all API endpoints
2. Configure your frontend to use the new API URL
3. Set up monitoring and alerting
4. Configure custom domain (if needed)
5. Set up CI/CD for automatic deployments
