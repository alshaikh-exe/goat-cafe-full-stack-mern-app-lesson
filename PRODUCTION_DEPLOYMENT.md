# Production Deployment Guide

## Overview

This guide explains how to build and deploy your Goat Cafe application for production.

## Build Process

### 1. Build the Frontend

```bash
npm run build
```

This command:
- Compiles your React components
- Bundles and optimizes your code
- Creates a `dist/` directory with production-ready files
- Minifies CSS, JavaScript, and other assets

### 2. Production File Structure

After building, your `dist/` directory will contain:
```
dist/
├── index.html          # Main HTML file
├── assets/             # Compiled CSS, JS, and other assets
│   ├── index-[hash].css
│   ├── index-[hash].js
│   └── [other-assets]
└── [other static files]
```

## Deployment Options

### Option 1: Single Server (Recommended for Learning)

Deploy both frontend and backend on the same server:

```bash
# 1. Build the frontend
npm run build

# 2. Set production environment variables
export NODE_ENV=production
export PORT=3000
export MONGO_URI=your-production-mongodb-url
export SECRET=your-production-secret

# 3. Start the production server
npm start
```

**How it works:**
- Express serves the built React app from `dist/` directory
- All routes (except `/api/*`) serve `dist/index.html`
- React Router handles client-side routing
- API calls go to your Express backend

### Option 2: Separate Frontend/Backend

Deploy frontend and backend on different servers:

**Backend (Express):**
```bash
# Deploy to Heroku, Railway, DigitalOcean, etc.
npm start
```

**Frontend (Vite build):**
```bash
# Deploy dist/ folder to:
# - Vercel
# - Netlify  
# - GitHub Pages
# - AWS S3 + CloudFront
```

## Environment Configuration

### Production Environment Variables

Create a `.env.production` file (don't commit this to git):

```bash
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/goat-cafe
SECRET=your-super-secure-production-secret
```

### Security Considerations

1. **Never commit secrets to git**
2. **Use strong, unique secrets in production**
3. **Enable HTTPS in production**
4. **Set up proper CORS for your production domain**

## How Refresh/Deep Linking Works

### Development Mode
- Vite dev server handles all routes
- React Router works seamlessly
- Page refreshes work on any route

### Production Mode
- Express serves `dist/index.html` for all non-API routes
- React Router takes over client-side routing
- Page refreshes work because Express always serves the React app

### Example Flow

1. User visits `/orders/history`
2. Express serves `dist/index.html` (React app)
3. React Router reads the URL and shows the correct component
4. User refreshes the page
5. Express serves `dist/index.html` again
6. React Router reads the URL and shows the correct component

## Deployment Platforms

### Heroku

```bash
# 1. Install Heroku CLI
# 2. Create app
heroku create your-app-name

# 3. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI=your-mongodb-url
heroku config:set SECRET=your-secret

# 4. Deploy
git push heroku main
```

### Railway

```bash
# 1. Connect your GitHub repo
# 2. Set environment variables in Railway dashboard
# 3. Railway automatically builds and deploys
```

### Vercel (Frontend Only)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy dist folder
vercel dist/
```

## Testing Production Build

### Local Production Testing

```bash
# 1. Build the app
npm run build

# 2. Test production build locally
npm start

# 3. Visit http://localhost:3000
# 4. Test all routes and refresh functionality
```

### Common Issues and Solutions

1. **404 on refresh:**
   - Ensure Express serves `dist/index.html` for all non-API routes
   - Check that the `dist/` directory exists and contains files

2. **API calls failing:**
   - Verify environment variables are set
   - Check MongoDB connection
   - Ensure CORS is configured properly

3. **Static assets not loading:**
   - Verify `dist/` directory structure
   - Check that Express is serving static files from the right directory

## Performance Optimization

### Build Optimization

Vite automatically:
- Tree-shakes unused code
- Minifies CSS and JavaScript
- Generates optimized asset hashes
- Splits code into chunks

### Additional Optimizations

1. **Enable gzip compression:**
```javascript
import compression from 'compression';
app.use(compression());
```

2. **Set cache headers:**
```javascript
app.use('/assets', express.static('dist/assets', {
  maxAge: '1y',
  immutable: true
}));
```

3. **Use a CDN for static assets**

## Monitoring and Maintenance

### Health Checks

Add a health check endpoint:

```javascript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});
```

### Logging

Use a production logging solution:

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Summary

- **Build**: `npm run build` creates `dist/` folder
- **Deploy**: Express serves React app from `dist/` directory
- **Routing**: All non-API routes serve `dist/index.html`
- **Refresh**: Works because Express always serves the React app
- **Environment**: Set `NODE_ENV=production` for production builds

This setup ensures that your React app works correctly in production with proper routing and refresh functionality.
