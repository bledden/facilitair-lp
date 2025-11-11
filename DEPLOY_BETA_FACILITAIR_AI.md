# Deploy Beta Dashboard to https://beta.facilitair.ai

Complete deployment guide for the Facilitair V10 Live Routing Demo with beta password protection.

---

## 🎯 Overview

**What you're deploying:**
- **Frontend**: Beta password gate (beta.html) + V10 Live Routing Demo (dashboard.html)
- **Backend**: Node.js Express server with beta password system
- **Database**: SQLite with beta_passwords and beta_sessions tables
- **Domain**: https://beta.facilitair.ai

**Already configured:**
- ✅ Beta password system in server.js (lines 1237-1515)
- ✅ Beta admin password set in .env (`GoBlake22$`)
- ✅ Railway deployment config (railway.json + railway.toml)
- ✅ Dashboard.html (V10 demo) copied from Corch_by_Fac
- ✅ Beta.html updated to load /dashboard.html

---

## 🚀 Quick Deploy to Railway

### 1. Verify Files

```bash
cd /Users/bledden/Documents/facilitair-lp

# Check key files exist
ls beta.html          # ✅ Password gate
ls dashboard.html     # ✅ V10 demo dashboard
ls server.js          # ✅ Backend with beta system
ls .env               # ✅ Has BETA_ADMIN_PASSWORD
```

### 2. Add V10 Proxy Endpoint

The dashboard.html calls `/api/v10/route` but server.js doesn't have this endpoint yet.

**Option A: Mock routing (no V10 server required)**

Add this to server.js around line 1556 (before "// Serve HTML pages"):

```javascript
// ==================== V10 ROUTING API PROXY ====================

// Mock V10 routing endpoint (replace with real V10 server proxy when available)
app.post('/api/v10/route', (req, res) => {
    try {
        const { task } = req.body;

        if (!task || task.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Task description is required'
            });
        }

        // Simple heuristic routing for demo (replace with real V10 API call)
        const taskLower = task.toLowerCase();
        let strategy = 'DIRECT';
        let capability = 'code_generation';
        let domain = 'backend';
        let execution_type = 'pure_sequential';

        if (taskLower.includes('deploy') || taskLower.includes('ci/cd')) {
            capability = 'deployment';
            domain = 'infrastructure';
            strategy = 'ORCHESTRATE';
        } else if (taskLower.includes('test')) {
            capability = 'unit_testing';
            domain = 'testing';
        } else if (taskLower.includes('frontend') || taskLower.includes('react') || taskLower.includes('ui')) {
            capability = 'code_generation';
            domain = 'frontend';
        } else if (taskLower.includes('api') || taskLower.includes('backend')) {
            capability = 'code_generation';
            domain = 'backend';
        } else if (taskLower.includes('data') || taskLower.includes('processing')) {
            capability = 'data_processing';
            domain = 'backend';
        }

        if (task.split(' ').length > 15 || taskLower.includes('comprehensive') || taskLower.includes('pipeline')) {
            strategy = 'ORCHESTRATE';
        }

        if (taskLower.includes('parallel')) {
            execution_type = 'pure_parallel';
        } else if (taskLower.includes('if') || taskLower.includes('conditional')) {
            execution_type = 'conditional';
        }

        res.json({
            success: true,
            strategy,
            capability,
            domain,
            execution_type,
            confidence: {
                strategy: 0.75 + Math.random() * 0.2,
                capability: 0.65 + Math.random() * 0.25,
                domain: 0.70 + Math.random() * 0.25,
                execution_type: 0.55 + Math.random() * 0.30
            }
        });
    } catch (error) {
        console.error('V10 routing error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
```

**Option B: Real V10 server proxy (requires V10 server running)**

```javascript
// ==================== V10 ROUTING API PROXY ====================

const V10_SERVER_URL = process.env.V10_SERVER_URL || 'http://localhost:5001';

app.post('/api/v10/route', async (req, res) => {
    try {
        const { task } = req.body;

        if (!task || task.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Task description is required'
            });
        }

        // Forward to V10 server
        const response = await fetch(`${V10_SERVER_URL}/route`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ task })
        });

        if (!response.ok) {
            throw new Error(`V10 server returned ${response.status}`);
        }

        const decision = await response.json();

        res.json({
            success: true,
            ...decision
        });
    } catch (error) {
        console.error('V10 routing error:', error);
        res.status(500).json({
            success: false,
            error: 'V10 routing service temporarily unavailable'
        });
    }
});
```

### 3. Test Locally

```bash
# Start server
npm start

# Test in browser
open http://localhost:3000/beta

# Login with password: GoBlake22$

# Or test beta admin
open http://localhost:3000/beta-admin
```

### 4. Deploy to Railway

```bash
# Make sure you're in the facilitair-lp directory
cd /Users/bledden/Documents/facilitair-lp

# Initialize Railway project (if not already done)
railway link

# Set environment variables
railway variables set BETA_ADMIN_PASSWORD=GoBlake22$
railway variables set RESEND_API_KEY=re_xxxxxxxxxxxxx
railway variables set ADMIN_API_KEY=your-admin-key

# Deploy
railway up

# View deployment
railway logs
```

### 5. Configure Custom Domain

In Railway dashboard:

1. Go to your facilitair-lp project
2. Click Settings → Domains
3. Add custom domain: `beta.facilitair.ai`
4. Update DNS:
   - Type: CNAME
   - Name: beta
   - Value: (Railway will provide the target, e.g., `facilitair-lp.up.railway.app`)
   - TTL: Auto or 300

5. Wait for SSL certificate (2-5 minutes)

---

## 🔐 Beta Access Workflow

### For You (Admin):

1. Visit `https://beta.facilitair.ai/beta-admin`
2. Login with `GoBlake22$`
3. Generate new password for each beta user (e.g., "John Doe - john@example.com")
4. Share password with user via email/DM

### For Beta Users:

1. Receive password from you
2. Visit `https://beta.facilitair.ai/beta` (or just `https://beta.facilitair.ai`)
3. Enter password
4. Access V10 Live Routing Demo for 7 days
5. Session persists across browser sessions

---

## 📁 File Structure on Railway

```
facilitair-lp/
├── server.js              # Express server with beta system
├── beta.html              # Password gate (main entry)
├── beta-admin.html        # Admin dashboard
├── dashboard.html         # V10 demo (protected content)
├── .env                   # Environment variables (not deployed)
├── railway.json           # Railway build config
├── railway.toml           # Railway deploy config
└── facilitair-emails.db   # SQLite database (persisted via volume)
```

---

## 🧪 Testing Checklist

Before going live:

- [ ] Local test: `npm start` → http://localhost:3000/beta
- [ ] Admin login works: http://localhost:3000/beta-admin
- [ ] Generate test password in admin
- [ ] User login works with test password
- [ ] Dashboard loads (V10 demo)
- [ ] Routing works (try example tasks)
- [ ] Logout clears session
- [ ] Session persists on page reload
- [ ] Railway deployment succeeds
- [ ] Production URL works: https://beta.facilitair.ai/beta
- [ ] SSL certificate active (https)
- [ ] Admin dashboard works on production
- [ ] Generate password on production
- [ ] User login works on production

---

## 🎨 Current Dashboard

**File**: `dashboard.html` (copied from `/Users/bledden/Documents/Corch_by_Fac/outputs/html/v10_demo_live.html`)

**Features**:
- Live task routing interface
- 4 routing dimensions (Strategy, Capability, Domain, Execution Type)
- Confidence scores with visual bars
- Example tasks (Deploy React App, Write Tests, Build API, etc.)
- Real-time model accuracy metrics (simulated)
- Beautiful Facilitair branding (teal gradient, dark theme)

**API Call**: `POST /api/v10/route` with `{ task: "..." }`

---

## 🔄 Updating the Dashboard

If you want to use a different demo HTML from Corch_by_Fac:

```bash
# Copy new demo to dashboard.html
cp /Users/bledden/Documents/Corch_by_Fac/outputs/html/NEW_DEMO.html \
   /Users/bledden/Documents/facilitair-lp/dashboard.html

# Deploy update
cd /Users/bledden/Documents/facilitair-lp
railway up
```

---

## 🚨 Troubleshooting

### Issue: "Routing error" in dashboard

**Cause**: `/api/v10/route` endpoint not added to server.js
**Fix**: Add Option A (mock) or Option B (real V10 proxy) from step 2 above

### Issue: Beta login fails

**Cause**: Database tables not created
**Fix**: Server.js automatically creates tables on startup. Check Railway logs:

```bash
railway logs | grep "CREATE TABLE.*beta"
```

### Issue: Admin password doesn't work

**Cause**: BETA_ADMIN_PASSWORD not set in Railway
**Fix**:

```bash
railway variables set BETA_ADMIN_PASSWORD=GoBlake22$
railway restart
```

### Issue: Dashboard shows blank page

**Cause**: dashboard.html not deployed
**Fix**:

```bash
# Verify file exists
ls /Users/bledden/Documents/facilitair-lp/dashboard.html

# Redeploy
railway up
```

### Issue: SSL not working

**Cause**: DNS propagation or Railway SSL provisioning
**Fix**: Wait 5-10 minutes, then check Railway dashboard for SSL status

---

## 📊 Database Schema

Already created in server.js (lines 1237-1259):

```sql
CREATE TABLE IF NOT EXISTS beta_passwords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    password TEXT UNIQUE NOT NULL,
    password_hash TEXT UNIQUE NOT NULL,
    label TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME,
    revoked BOOLEAN DEFAULT 0,
    use_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS beta_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_token TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
);
```

---

## 🎯 Next Steps After Deployment

1. **Test end-to-end**:
   - Visit https://beta.facilitair.ai/beta-admin
   - Generate 3 test passwords
   - Test user login flow
   - Test routing with example tasks

2. **Invite beta users**:
   - Generate passwords in admin dashboard
   - Send personalized emails with passwords
   - Include link: https://beta.facilitair.ai/beta

3. **Monitor usage**:
   ```bash
   # Check active sessions
   railway run sqlite3 facilitair-emails.db "SELECT COUNT(*) FROM beta_sessions WHERE datetime(expires_at) > datetime('now');"

   # Check password usage
   railway run sqlite3 facilitair-emails.db "SELECT label, use_count, last_used_at FROM beta_passwords ORDER BY use_count DESC;"
   ```

4. **Optional: Deploy V10 server separately**:
   - Deploy v10_demo_server.py to Railway as separate service
   - Set V10_SERVER_URL environment variable
   - Update server.js to use Option B (real V10 proxy)

---

## 💯 Production Checklist

Before sharing beta link:

- [ ] /api/v10/route endpoint added to server.js
- [ ] Railway deployment successful
- [ ] Custom domain configured (beta.facilitair.ai)
- [ ] SSL certificate active
- [ ] BETA_ADMIN_PASSWORD set in Railway
- [ ] Database volume configured (data persists)
- [ ] Admin dashboard accessible
- [ ] Test password generated and verified
- [ ] User flow tested end-to-end
- [ ] Routing demo works (all example tasks)
- [ ] Session persistence verified
- [ ] Logout functionality tested

---

## 📞 Quick Commands

```bash
# Deploy to Railway
cd /Users/bledden/Documents/facilitair-lp && railway up

# View logs
railway logs

# Check environment variables
railway variables

# Open in browser
railway open

# Run database query
railway run sqlite3 facilitair-emails.db "SELECT * FROM beta_passwords;"

# Restart service
railway restart
```

---

**Status**: Ready to deploy with `/api/v10/route` endpoint added

**Next step**: Add the V10 routing endpoint to server.js (choose Option A for mock or Option B for real V10 server)

**Deployment time**: ~3 minutes

**Your beta admin password**: `GoBlake22$`
