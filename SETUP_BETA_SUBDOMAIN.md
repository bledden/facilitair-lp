# Setup beta.facilitair.ai DNS

## Quick Fix for beta.facilitair.ai Not Loading

You have DNS set up for `facilitair.ai` but need to add a record for `beta.facilitair.ai`

---

## Step 1: Get Your Railway URL

1. Go to https://railway.app
2. Log into your account
3. Find your **facilitair-lp** project
4. Click on it → Go to **Settings** → **Domains**
5. Look for the Railway-generated URL (looks like):
   - `facilitair-lp-production.up.railway.app`
   - OR something like `facilitair-lp-production-abc123.up.railway.app`

**Copy this URL** (without https://)

---

## Step 2: Add DNS Record in Cloudflare

1. Go to https://dash.cloudflare.com
2. Log in
3. Click on **facilitair.ai**
4. Click **DNS** in the left sidebar
5. Click **"Add record"** button

### Fill in the form:

- **Type**: `CNAME`
- **Name**: `beta` (this creates beta.facilitair.ai)
- **Target**: Paste your Railway URL (e.g., `facilitair-lp-production.up.railway.app`)
- **Proxy status**: **ON** (orange cloud icon) ← This enables SSL
- **TTL**: `Auto`

6. Click **Save**

---

## Step 3: Wait 2-5 Minutes

- DNS propagation: ~2 minutes
- SSL certificate: ~3 minutes
- Total wait: ~5 minutes max

---

## Step 4: Test

After 5 minutes:

```bash
# Test if DNS is working
curl https://beta.facilitair.ai/health

# Should return: {"status":"ok","timestamp":"..."}
```

Or just visit in browser:
- https://beta.facilitair.ai/ (should show password gate)
- https://beta.facilitair.ai/beta-admin (should show admin login)

---

## If It Still Doesn't Work

### Check Railway is Running

1. Go to Railway dashboard
2. Check if facilitair-lp service is **Active** (green)
3. Click on service → **Deployments** tab
4. Make sure latest deployment succeeded
5. Check logs for errors

### Check DNS Propagation

```bash
# Check if beta subdomain resolves
dig beta.facilitair.ai

# Or use online tool
# https://dnschecker.org/#CNAME/beta.facilitair.ai
```

### Verify Railway Domain

In Railway dashboard:
1. Settings → Domains
2. You should see either:
   - Just the Railway URL (e.g., `facilitair-lp-production.up.railway.app`)
   - OR custom domain added (e.g., `beta.facilitair.ai`)

**If you see a custom domain there**, remove it! Railway doesn't need to know about beta.facilitair.ai - Cloudflare handles the routing.

---

## Summary

**What you're doing:**
- Adding a CNAME record in Cloudflare
- `beta.facilitair.ai` → points to → `facilitair-lp-production.up.railway.app`
- Cloudflare provides SSL automatically (orange cloud)

**After setup:**
- `https://beta.facilitair.ai/` loads beta password gate
- `https://beta.facilitair.ai/beta-admin` loads admin dashboard
- SSL works automatically
- CDN speeds up loading globally

---

## Current Status

❌ DNS record not added yet (that's why beta.facilitair.ai loads nothing)

**Next step**: Add the CNAME record in Cloudflare (takes 2 minutes)
