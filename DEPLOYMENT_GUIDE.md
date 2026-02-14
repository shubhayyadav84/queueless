# QueueLess Deployment Guide

## Deployment Overview

We'll deploy:
1. **Backend** to Render (Node.js + MongoDB)
2. **Frontend** to Vercel (React + Vite)

---

## Step 1: Deploy Backend to Render

### 1.1 Create MongoDB Atlas Database (Free)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account
3. Create a new cluster (M0 - Free tier)
4. Click "Database Access" → "Add New Database User"
   - Username: `queueless_user`
   - Password: Generate a secure password
   - Save these credentials!
5. Click "Network Access" → "Add IP Address" → "Allow Access from Anywhere" (0.0.0.0/0)
6. Go to "Database" → Click "Connect" on your cluster
7. Choose "Drivers" → "Node.js"
8. Copy the connection string:
   ```
   mongodb+srv://queueless_user:<password>@cluster0.xxxxx.mongodb.net/queueless?retryWrites=true&w=majority
   ```

### 1.2 Create Render Account & Deploy Backend

1. Go to https://render.com and sign up
2. Click "New" → "Web Service"
3. Connect your GitHub/GitLab repository or use "Public Git repository"
4. If using Public Git repository, enter your repo URL
5. Configure the service:
   - **Name**: `queueless-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

6. Add Environment Variables:
   Click "Advanced" → "Add Environment Variable"
   
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `MONGODB_URI` | `mongodb+srv://queueless_user:<password>@cluster0.xxxxx.mongodb.net/queueless?retryWrites=true&w=majority` |
   | `JWT_SECRET` | `your-super-secret-jwt-key-min-32-chars` |
   | `JWT_EXPIRE` | `7d` |
   | `DEMO_MODE` | `true` |
   | `CLIENT_URL` | `https://your-frontend-url.vercel.app` |

7. Click "Create Web Service"
8. Wait for deployment to complete (2-3 minutes)
9. Note your backend URL: `https://queueless-backend.onrender.com`

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Update Frontend Environment Variables

Before deploying, update the production API URL:

1. Open `frontend/.env.production`
2. Replace the placeholder URLs with your actual Render backend URL:
   ```
   VITE_API_URL=https://queueless-backend.onrender.com/api
   VITE_SOCKET_URL=https://queueless-backend.onrender.com
   ```

3. Commit and push changes to your repository

### 2.2 Deploy to Vercel

1. Go to https://vercel.com and sign up (use GitHub login)
2. Click "Add New Project"
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://queueless-backend.onrender.com/api` |
   | `VITE_SOCKET_URL` | `https://queueless-backend.onrender.com` |

6. Click "Deploy"
7. Wait for deployment (1-2 minutes)
8. Your frontend URL: `https://queueless-frontend.vercel.app`

---

## Step 3: Update CORS Settings (Important!)

After deployment, update the backend CORS to allow your frontend domain:

### Option A: Update server.js

Edit `backend/server.js` and update the CORS configuration:

```javascript
// Replace this:
app.use(cors());

// With this:
app.use(cors({
  origin: ['https://your-frontend-url.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

### Option B: Use Environment Variable

Update `backend/server.js`:

```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
```

Then add `CLIENT_URL` environment variable in Render with your Vercel frontend URL.

---

## Step 4: Verify Deployment

### Test Backend
```bash
curl https://queueless-backend.onrender.com/api/health
```
Should return: `{"success":true,"message":"QueueLess API is running"}`

### Test Frontend
1. Open your Vercel frontend URL
2. Try to register/login
3. Test all features

---

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check username/password in connection string
- Ensure database user has read/write permissions

### CORS Errors
- Update `CLIENT_URL` in Render environment variables
- Make sure it matches exactly (including https://)
- Redeploy backend after CORS changes

### Socket.IO Not Working
- Socket.IO requires sticky sessions on some platforms
- Render free tier doesn't support sticky sessions well
- Consider using Railway or upgrading Render plan for better Socket.IO support

### Build Failures
- Check Node.js version (should be 18+)
- Verify all dependencies are in package.json
- Check build logs for specific errors

---

## Alternative: Deploy Everything to Railway (Easier)

If you want a simpler deployment:

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Add MongoDB plugin (New → Database → Add MongoDB)
5. Deploy backend with environment variables
6. Deploy frontend
7. Railway handles networking between services automatically

---

## Post-Deployment Checklist

- [ ] Backend health check passes
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] OTP login works
- [ ] Business registration works (as owner)
- [ ] Queue creation works
- [ ] Token booking works (as patient)
- [ ] Real-time updates work
- [ ] All roles function correctly

---

## Free Tier Limits

### Render (Free)
- Web Services: 512 MB RAM, sleeps after 15 min inactivity
- Bandwidth: 100 GB/month
- Builds: 500 minutes/month

### Vercel (Free)
- Bandwidth: 100 GB/month
- Build Execution: 6000 minutes/month
- Serverless Function Execution: 100 GB-hours

### MongoDB Atlas (Free M0)
- Storage: 512 MB
- RAM: Shared
- Connections: 500 max

---

## Need Help?

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
