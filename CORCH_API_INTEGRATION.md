# Corch API Integration with Beta Dashboard

## Problem
The beta dashboard at https://beta.facilitair.ai currently points to `localhost:8000`, so it can't execute real tasks. We need to connect it to a production Corch API.

## Solution Architecture

```
User Flow:
1. User logs into beta.facilitair.ai with password
2. Dashboard loads (beta-dashboard.html)
3. Dashboard makes API calls to production Corch API
4. Tasks execute with V13 orchestration
5. Results stream back to dashboard

Components:
├── beta.facilitair.ai (frontend)
│   └── beta-dashboard.html (UI)
└── api.facilitair.ai (or separate domain)
    └── Corch API (FastAPI backend with V13)
```

## Option 1: Deploy Corch API to Railway (Recommended)

### Step 1: Prepare Corch Project for Deployment

**1.1: Create railway.json in Corch project root:**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn api.server:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**1.2: Create requirements.txt** (if not exists):

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
sentence-transformers==2.2.2
torch==2.1.0
pydantic==2.5.0
python-dotenv==1.0.0
```

**1.3: Update CORS in api/server.py:**

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://facilitair.ai",
        "https://beta.facilitair.ai",
        "https://*.facilitair.ai",
        "http://localhost:3000"  # for local testing
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Step 2: Deploy to Railway

**2.1: Install Railway CLI** (if not installed):
```bash
npm install -g @railway/cli
```

**2.2: Login to Railway:**
```bash
cd /Users/bledden/Documents/Corch_by_Fac
railway login
```

**2.3: Create new Railway project:**
```bash
railway init
# Name it: corch-api
```

**2.4: Add PostgreSQL database:**
```bash
railway add
# Select: PostgreSQL
```

**2.5: Set environment variables:**
```bash
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'
railway variables set PORT='8000'
railway variables set OPENROUTER_API_KEY='your_openrouter_key'
railway variables set V13_MODEL_PATH='backend/foundation_model/checkpoints/best_model.pt'
```

**2.6: Deploy:**
```bash
railway up
```

**2.7: Get your Railway URL:**
```bash
railway domain
# Output: https://corch-api-production-xxxx.railway.app
```

### Step 3: Update Beta Dashboard

Edit `beta-dashboard.html` line 669:

```javascript
// Before:
const API_BASE = 'http://localhost:8000';

// After:
const API_BASE = 'https://corch-api-production-xxxx.railway.app';
```

Or use a custom domain:
```javascript
const API_BASE = 'https://api.facilitair.ai';
```

### Step 4: Configure Custom Domain (Optional)

**In Cloudflare:**
1. Add CNAME record:
   - Name: `api`
   - Target: `corch-api-production-xxxx.railway.app`
   - Proxy: Enabled

**In Railway:**
1. Go to Settings > Domains
2. Add custom domain: `api.facilitair.ai`
3. Railway will provide DNS instructions

## Option 2: Use Existing Server/VPS

If you have a VPS or server:

### Step 1: Deploy Corch API

```bash
# On your server
cd /var/www
git clone your-corch-repo
cd corch

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://user:pass@localhost/corch"
export OPENROUTER_API_KEY="your_key"

# Run with systemd or pm2
# systemd:
sudo systemctl start corch-api

# OR pm2:
pm2 start "uvicorn api.server:app --host 0.0.0.0 --port 8000" --name corch-api
```

### Step 2: Configure Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.facilitair.ai;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 3: Add SSL with Certbot

```bash
sudo certbot --nginx -d api.facilitair.ai
```

## Option 3: Serverless (Advanced)

Deploy to Vercel/Netlify with serverless functions, but this requires more adaptation of the FastAPI code.

## Implementation Checklist

### Backend (Corch API)
- [ ] Update CORS to allow facilitair.ai domains
- [ ] Deploy to Railway (or VPS)
- [ ] Set up PostgreSQL database
- [ ] Configure environment variables
- [ ] Test API health endpoint
- [ ] Note the production URL

### Frontend (Beta Dashboard)
- [ ] Update API_BASE to production URL
- [ ] Update API_KEY if needed
- [ ] Test CORS (check browser console)
- [ ] Commit changes
- [ ] Push to GitHub (triggers Railway deploy)

### DNS (if using custom domain)
- [ ] Add CNAME for api.facilitair.ai
- [ ] Configure in Railway domains
- [ ] Wait for DNS propagation (5-10 min)
- [ ] Test with curl

### Testing
- [ ] Visit beta.facilitair.ai
- [ ] Login with beta password
- [ ] Create a test task
- [ ] Verify task executes
- [ ] Check V13 routing decision displays
- [ ] Verify cost tracking works

## Quick Start (Railway Recommended)

**Fastest path to get it working:**

```bash
# 1. Navigate to Corch project
cd /Users/bledden/Documents/Corch_by_Fac

# 2. Update CORS in api/server.py
# (see Step 1.3 above)

# 3. Deploy to Railway
railway login
railway init
railway add  # Add PostgreSQL
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'
railway up

# 4. Get Railway URL
railway domain
# Copy the URL (e.g., https://corch-api-production-xxxx.railway.app)

# 5. Update beta dashboard
cd /Users/bledden/Documents/facilitair-lp
# Edit beta-dashboard.html line 669 with Railway URL

# 6. Deploy
git add beta-dashboard.html
git commit -m "Update API endpoint to production"
git push origin main

# Done! Test at beta.facilitair.ai
```

## Testing the Integration

### 1. Test API Directly

```bash
# Health check
curl https://your-railway-url.railway.app/healthz

# Create task (with API key)
curl -X POST https://your-railway-url.railway.app/v1/tasks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: facilitair_dev_key" \
  -d '{
    "task": {
      "prompt": "Write a hello world function"
    },
    "options": {
      "strategy": "auto"
    },
    "stop_conditions": {
      "max_steps": 10
    }
  }'
```

### 2. Test from Dashboard

1. Open beta.facilitair.ai
2. Login with beta password
3. Open browser DevTools (F12) > Console
4. Create a task in the dashboard
5. Watch for API requests
6. Check for CORS errors (should be none)

### 3. Common Issues

**CORS Error:**
```
Access to fetch at 'https://api...' from origin 'https://beta.facilitair.ai'
has been blocked by CORS policy
```
**Fix:** Update CORS settings in api/server.py

**API Key Error:**
```
401 Unauthorized - Invalid API key
```
**Fix:** Ensure API_KEY in beta-dashboard.html matches backend

**Connection Refused:**
```
Failed to fetch
```
**Fix:** Check Railway deployment status, verify URL

## Environment Variables Reference

### Corch API (Railway)
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-set by Railway
PORT=8000
OPENROUTER_API_KEY=your_openrouter_key
V13_MODEL_PATH=backend/foundation_model/checkpoints/best_model.pt
REDIS_URL=${{Redis.REDIS_URL}}  # If using Redis
```

### Beta Dashboard (beta-dashboard.html)
```javascript
const API_BASE = 'https://your-api-url.railway.app';
const API_KEY = 'facilitair_dev_key';  // Match backend API key
```

## Next Steps After Integration

1. **Monitor Usage:**
   - Railway provides logs and metrics
   - Monitor API response times
   - Track token usage and costs

2. **Scale if Needed:**
   - Railway auto-scales
   - Add Redis for caching
   - Use database connection pooling

3. **Add Features:**
   - WebSocket for real-time updates
   - Streaming responses
   - Task history pagination

4. **Security:**
   - Rotate API keys regularly
   - Add rate limiting
   - Monitor for abuse

---

**Current Status:**
- ✅ Beta dashboard created
- ✅ Password protection working
- ⏳ Corch API needs deployment
- ⏳ Dashboard needs production API URL

**Next Action:** Deploy Corch API to Railway following Option 1 steps above
