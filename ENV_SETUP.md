# Environment Variables Setup

## For Local Development

Create a `.env` file in the root directory with these variables:

```env
NODE_ENV=development
PORT=5000

# Your MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/SafeHomeChild?appName=Cluster0

# Generate a strong secret: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Your frontend URL
CORS_ORIGIN=http://localhost:3000

# Optional: Location retention days
LOCATION_RETENTION_DAYS=30
```

## For Render Deployment

Set these environment variables in Render Dashboard:

### Required Variables:

1. **MONGODB_URI**
   - Your MongoDB Atlas connection string
   - Example: `mongodb+srv://user:pass@cluster.mongodb.net/SafeHomeChild?appName=Cluster0`

2. **JWT_SECRET**
   - A strong random string for JWT token signing
   - Generate with: `openssl rand -base64 32`
   - Example: `aBc123XyZ789...` (at least 32 characters)

3. **CORS_ORIGIN**
   - Your frontend URL
   - Example: `https://safehomechild-coral.vercel.app`
   - For multiple origins: `https://safehomechild-coral.vercel.app,http://localhost:3000`

### Optional Variables:

- **NODE_ENV** = `production` (Render usually sets this automatically)
- **PORT** = (Render sets this automatically, usually 10000)
- **LOCATION_RETENTION_DAYS** = `30` (default)

## Quick Setup for Render

1. Go to Render Dashboard → Your Service → Environment
2. Add these variables:
   ```
   MONGODB_URI = mongodb+srv://your-connection-string
   JWT_SECRET = your-generated-secret-key
   CORS_ORIGIN = https://safehomechild-coral.vercel.app
   ```
3. Save and redeploy

## Security Notes

- Never commit `.env` file to git (already in .gitignore)
- Use strong, random JWT_SECRET in production
- Keep MongoDB credentials secure
- Only whitelist trusted origins in CORS_ORIGIN

