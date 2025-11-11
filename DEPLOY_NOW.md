# Deploy to beta.facilitair.ai

## ✅ Everything is Ready

All changes have been made. Here's what's configured:

### URLs
- `https://beta.facilitair.ai/` → Password gate (beta.html)
- `https://beta.facilitair.ai/beta-admin` → Admin dashboard
- `https://beta.facilitair.ai/dashboard.html` → V10 demo (after login)

### Files Modified
- ✅ `server.js` line 1638: Root route now serves `beta.html`
- ✅ `server.js` lines 1560-1634: V10 routing API added
- ✅ `beta.html` line 295: Points to `/dashboard.html`
- ✅ `dashboard.html`: V10 demo copied from Corch_by_Fac

### Admin Password
`GoBlake22$` (already in .env)

---

## Deploy via Railway Web Dashboard

Since you don't have Railway CLI, use the web interface:

### 1. Push to GitHub

```bash
cd /Users/bledden/Documents/facilitair-lp

git add .
git commit -m "Add V10 beta dashboard with password protection"
git push
```

### 2. Configure Railway

1. Go to https://railway.app
2. Find your facilitair-lp project
3. If not connected to GitHub yet:
   - Settings → Connect Repo → Select facilitair-lp
4. Set environment variables (if not already set):
   - `BETA_ADMIN_PASSWORD=GoBlake22$`
   - `RESEND_API_KEY=re_xxxxxxxxxxxxx`
   - `ADMIN_API_KEY=your-admin-key`

### 3. Add Domain

1. In Railway dashboard → Settings → Domains
2. Click "Add Domain"
3. Enter: `beta.facilitair.ai`
4. Railway will show you a CNAME target (e.g., `facilitair-lp.up.railway.app`)

### 4. Update DNS

In your DNS provider (Cloudflare, etc.):
- Type: `CNAME`
- Name: `beta`
- Target: `facilitair-lp.up.railway.app` (or whatever Railway shows)
- TTL: Auto or 300

### 5. Wait for SSL

SSL certificate will be auto-provisioned in 2-5 minutes.

---

## Test After Deploy

1. Visit `https://beta.facilitair.ai/`
2. Should see password gate
3. Visit `https://beta.facilitair.ai/beta-admin`
4. Login with `GoBlake22$`
5. Generate test password
6. Go back to `https://beta.facilitair.ai/`
7. Enter test password
8. Should see V10 routing demo

---

## User Invitation

Once deployed, share with beta users:

**Subject**: Welcome to Facilitair Beta

**Message**:
```
Hi [Name],

You've been invited to try Facilitair's V10 Live Routing Demo!

Visit: https://beta.facilitair.ai/
Password: [generated password]

You'll have access for 7 days. Try routing different tasks and see how our V10 model categorizes them.

Questions? Reply to this email.

- Blake
```

---

## Current Status

- ✅ Beta system integrated
- ✅ V10 routing API added
- ✅ Dashboard copied
- ✅ Root URL configured
- ✅ Admin password set
- ⏳ Awaiting GitHub push + Railway deployment

**Next step**: Push to GitHub and let Railway auto-deploy.
