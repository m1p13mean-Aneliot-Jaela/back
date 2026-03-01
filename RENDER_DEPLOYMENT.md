# Render Deployment Guide

## Prerequisites
- A Render account (sign up at https://render.com)
- MongoDB database (MongoDB Atlas recommended)
- Git repository connected to your project

## Deployment Options

### Option 1: Deploy via Render Dashboard (Recommended)

1. **Create New Web Service**
   - Go to https://render.com/dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub/GitLab repository
   - Select the `back` directory as the root directory

2. **Configure Service**
   - **Name**: `m1p13mean-backend` (or your preferred name)
   - **Region**: Frankfurt (or your preferred region)
   - **Branch**: `main`
   - **Root Directory**: `back`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or upgrade as needed)

3. **Set Environment Variables**
   
   Go to "Environment" tab and add:
   
   | Key | Value | Notes |
   |-----|-------|-------|
   | `NODE_ENV` | `production` | |
   | `PORT` | `3000` | Auto-set by Render |
   | `HOST` | `0.0.0.0` | |
   | `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | (Generate secure value) | Click "Generate" for random value |
   | `JWT_EXPIRES_IN` | `24h` | |
   | `JWT_REFRESH_SECRET` | (Generate secure value) | Click "Generate" for random value |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` | |
   | `CORS_ORIGIN` | `https://your-app.vercel.app` | Your frontend URL |
   | `LOG_LEVEL` | `info` | |

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy your application

### Option 2: Deploy using render.yaml (Infrastructure as Code)

1. **Update render.yaml**
   - Edit `render.yaml` in the `back` directory
   - Update `CORS_ORIGIN` with your Vercel frontend URL
   - Commit and push changes

2. **Create Blueprint**
   - Go to https://render.com/dashboard
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Select `back/render.yaml` as the configuration file
   - Render will create all services defined in the YAML

3. **Set Secrets**
   - Go to each service's Environment tab
   - Set `MONGODB_URI` (not defined in YAML for security)
   - Verify auto-generated secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`)

## MongoDB Setup

### Using MongoDB Atlas (Recommended)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Add IP `0.0.0.0/0` to IP Whitelist (allows Render to connect)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/database`
6. Add connection string to Render environment variables as `MONGODB_URI`

### Using Render PostgreSQL (Alternative)

If you want to use PostgreSQL instead of MongoDB, you'll need to:
1. Refactor the application to use PostgreSQL/Sequelize
2. Create a PostgreSQL database in Render Dashboard
3. Update the connection configuration

## Health Checks

The application includes a health check endpoint at `/health` that Render uses to monitor service health.

**Health Check Path**: `/health`  
**Expected Response**: `200 OK`

## Automatic Deployments

Render automatically deploys your application when you push to the connected branch (default: `main`).

To disable automatic deployments:
1. Go to Settings → "Auto-Deploy"
2. Change to "No" for manual deployments

## Custom Domain

1. Go to Settings → "Custom Domain"
2. Add your domain (e.g., `api.yourdomain.com`)
3. Update DNS records as instructed by Render
4. Render automatically provisions SSL certificate

## Logs and Monitoring

- **View Logs**: Click "Logs" tab in service dashboard
- **Metrics**: Available in "Metrics" tab (CPU, Memory, Network)
- **Shell Access**: Click "Shell" tab to access container

## Environment URLs

After deployment, your API will be available at:
- **Production**: `https://m1p13mean-backend.onrender.com`
- **Custom Domain**: `https://api.yourdomain.com` (if configured)

## Update Frontend to Use Production API

After deploying, update your frontend environment configuration:

**File**: `front/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://m1p13mean-backend.onrender.com/api'
};
```

Then redeploy your frontend on Vercel.

## Troubleshooting

### Build Fails
- Check build logs in Render Dashboard
- Verify `package.json` has all required dependencies
- Ensure Node.js version compatibility

### Service Unhealthy
- Check if MongoDB connection is working
- Verify environment variables are set correctly
- Review application logs for errors

### CORS Errors
- Ensure `CORS_ORIGIN` matches your frontend URL exactly
- Include protocol (https://) in the URL
- Check if frontend is on a custom domain

### Database Connection Issues
- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas (should include `0.0.0.0/0`)
- Ensure database user has proper permissions

### Service Sleeps After Inactivity (Free Plan)
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Upgrade to paid plan to prevent sleeping

## Scaling

### Horizontal Scaling
- Go to Settings → "Scaling"
- Increase number of instances
- Available on Standard plan and above

### Vertical Scaling
- Upgrade plan for more CPU/RAM
- Plans: Free, Starter, Standard, Pro, Pro Plus

## CI/CD Integration

Render automatically integrates with your Git repository:
- Push to `main` → Automatic deployment
- Pull Request → Preview deployments (on paid plans)
- Environment variables → Managed in Render Dashboard

## Cost Optimization

**Free Tier Limitations:**
- 750 hours/month free
- Service sleeps after 15 min inactivity
- Shares IP with other services
- Limited to 512 MB RAM

**Tips:**
- Use free MongoDB Atlas cluster
- Monitor usage in Render Dashboard
- Consider upgrading for production workloads

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Generate strong JWT secrets** - Use Render's "Generate" feature
3. **Whitelist CORS origins** - Don't use `*` in production
4. **Keep dependencies updated** - Regular `npm audit` checks
5. **Use HTTPS only** - Render provides SSL automatically

## Support

- **Render Docs**: https://render.com/docs
- **Community**: https://community.render.com
- **Status Page**: https://status.render.com
