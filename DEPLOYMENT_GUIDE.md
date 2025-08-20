# Replit to External Deployment Guide

This guide explains how to migrate a Replit project to external deployment platforms and can be used as a template for other Replit projects.

## Changes Made to Migrate from Replit

### 1. Removed Replit-Specific Dependencies
- Removed `@replit/vite-plugin-cartographer` from package.json
- Removed `@replit/vite-plugin-runtime-error-modal` from package.json
- Updated vite.config.ts to remove Replit-specific plugins and conditional loading

### 2. Updated Server Configuration
- Modified server/index.ts to use `process.env.PORT || 5000` instead of hardcoded port 5000
- Added dotenv support to load environment variables from .env file
- Removed Replit-specific port comments and constraints

### 3. Removed Replit Files
- Deleted `.replit` configuration file
- The `replit.md` file can be kept as documentation but is not needed for deployment

### 4. Added Standard Deployment Files
- `.env.example` - Template for environment variables
- `Dockerfile` - For containerized deployments
- `.dockerignore` - To exclude unnecessary files from Docker builds
- `render.yaml` - Configuration for Render.com deployment
- `vercel.json` - Configuration for Vercel deployment

## Free Deployment Platform Options

### 1. Render.com (Recommended)
**Best for:** Full-stack applications with database needs
**Free Tier:** 750 hours/month, automatic sleep after 15 minutes of inactivity
**Database:** Free PostgreSQL with 1GB storage

**Deployment Steps:**
1. Push code to GitHub repository
2. Connect GitHub account to Render
3. Create new "Web Service" from your repository
4. Render will automatically detect the `render.yaml` file
5. Set environment variables in Render dashboard
6. Deploy

**Pros:**
- Automatic database provisioning
- Easy setup with render.yaml
- Good free tier limits
- Supports PostgreSQL out of the box

### 2. Railway
**Best for:** Developer-friendly deployments
**Free Tier:** $5 credit monthly (usually sufficient for small apps)
**Database:** Built-in PostgreSQL support

**Deployment Steps:**
1. Push code to GitHub
2. Connect GitHub to Railway
3. Deploy from repository
4. Add PostgreSQL database service
5. Set DATABASE_URL environment variable

### 3. Heroku (Limited Free Tier)
**Note:** Heroku eliminated free tier in November 2022, now requires paid plans
**Minimum Cost:** $7/month per app

### 4. Vercel (Frontend Focus)
**Best for:** Frontend applications, limited backend support
**Free Tier:** Generous limits for frontend hosting
**Database:** Requires external database service (Neon, PlanetScale, etc.)

**Deployment Steps:**
1. Push code to GitHub
2. Connect Vercel to GitHub
3. Deploy (vercel.json will be used automatically)
4. Set up external database (see database options below)

### 5. Netlify (Frontend + Functions)
**Best for:** Static sites with serverless functions
**Free Tier:** Good for small applications
**Database:** Requires external database

## Database Options for Frontend-Focused Platforms

### Neon (Recommended)
- Free PostgreSQL with 3GB storage
- Serverless and auto-scaling
- Compatible with existing code

### Supabase
- Free PostgreSQL with 500MB storage
- Additional backend services
- Good free tier

### PlanetScale
- Free MySQL (requires code changes)
- 10GB storage on free tier

## Environment Variables Required

Copy `.env.example` to `.env` and fill in:

```bash
DATABASE_URL="postgresql://username:password@host:5432/database"
PORT=5000
NODE_ENV=production
SESSION_SECRET="your-secure-random-string"
```

## Local Testing

To test the application locally:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your database connection string
   - Set `PORT` (defaults to 3000 for development)

3. **Set up database:**
   ```bash
   npm run db:push
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```
   
   App will be available at `http://localhost:3000` (or your configured PORT)

## Pre-Deployment Checklist

Before deploying to any platform:

1. **Test production build locally:**
   ```bash
   npm run build
   npm run start
   ```

2. **Verify environment variables:**
   - Ensure DATABASE_URL is configured
   - Test database connectivity
   - Check all required environment variables are set

3. **Run database migrations:**
   ```bash
   npm run db:push
   ```

4. **Test file uploads:**
   - Ensure multer configuration works in production
   - Test with sample Blue Prism files

## Common Issues and Solutions

### Windows Development Issues
- **NODE_ENV not recognized:** Remove Unix-style environment variables from package.json scripts
- **Environment variables not loaded:** Install and configure dotenv package
- **Port conflicts:** Check if port 5000 is in use, change to 3000 or another available port

### Build Failures
- Ensure all dependencies are in `dependencies`, not `devDependencies` if needed in production
- Check Node.js version compatibility (project uses Node 20)
- Install dotenv: `npm install dotenv`

### Database Connection Issues
- Verify DATABASE_URL format: `postgresql://user:password@host:port/database`
- Check if database accepts external connections
- Ensure SSL mode is configured if required
- For Neon: Include `?sslmode=require` in connection string

### Port Configuration
- Use `process.env.PORT` for platform-provided ports
- Default fallback should be 3000 for local development (5000 often conflicts)
- Ensure dotenv is configured to load PORT from .env file

### File Upload Issues
- Check disk space limitations on deployment platform
- Consider using cloud storage (AWS S3, Cloudinary) for production
- Verify multer temporary directory permissions

## General Template for Other Replit Projects

To migrate any Replit project to external deployment:

### Step 1: Remove Replit Dependencies
```bash
npm uninstall @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal
```

### Step 2: Update Configuration Files
- Remove Replit-specific plugins from build tools (Vite, Webpack, etc.)
- Update port configuration to use `process.env.PORT`
- Remove hardcoded Replit constraints
- Remove Unix-style environment variables from package.json scripts (Windows compatibility)

### Step 3: Add Environment Variable Support
- Install dotenv: `npm install dotenv`
- Add dotenv configuration to main server file
- Create `.env.example` template

### Step 4: Add Standard Files
- Add `Dockerfile` for containerization
- Add platform-specific config files (render.yaml, vercel.json, etc.)

### Step 5: Update Dependencies
- Review and update all dependencies
- Ensure production dependencies are correctly categorized
- Add dotenv to dependencies

### Step 6: Test and Deploy
- Test locally with `npm run dev`
- Test production build locally
- Set up CI/CD if needed
- Deploy to chosen platform

## Performance Considerations

### For Production Deployment:
1. **Enable production optimizations:**
   - Set NODE_ENV=production
   - Use production database
   - Enable gzip compression

2. **Consider CDN for static assets:**
   - Use Cloudflare or similar
   - Optimize images and assets

3. **Database optimization:**
   - Set up connection pooling
   - Add database indexes
   - Monitor query performance

4. **Monitoring:**
   - Add application monitoring (Sentry, LogRocket)
   - Set up health checks
   - Monitor resource usage

This guide should work for most Node.js/React applications created on Replit. Adjust configurations based on your specific technology stack and requirements.