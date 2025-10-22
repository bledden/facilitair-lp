# FACILITAIR Deployment Guide - facilitair.ai

Complete guide to deploy FACILITAIR landing page with email backend to production on facilitair.ai with Cloudflare.

## 🚀 Deployment Options

For facilitair.ai with Cloudflare, I recommend **Railway** or **Render** for the backend + frontend (easiest 24/7 hosting).

## Option 1: Railway (Recommended - Easiest)

Railway provides simple deployment with automatic builds and 24/7 uptime.

### Step 1: Prepare for Deployment

1. **Update .env for production**:
```env
NODE_ENV=production
PORT=3000
BASE_URL=https://facilitair.ai
ADMIN_API_KEY=your-secure-random-string-here
RESEND_API_KEY=re_cSfXDoL4_3ojXujNSuP8vjFjKgqzV8tJG
FROM_EMAIL=FACILITAIR <onboarding@facilitair.ai>
```

2. **Update package.json start script** (already done):
```json
"scripts": {
  "start": "node server.js"
}
```

### Step 2: Deploy to Railway

1. **Sign up**: Go to [railway.app](https://railway.app) and sign in with GitHub
2. **New Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select Repository**: Choose `facilitair-lp` repository
4. **Add Environment Variables**:
   - Click on your service → Variables tab
   - Add all variables from your `.env` file:
     - `NODE_ENV` = `production`
     - `BASE_URL` = `https://facilitair.ai`
     - `ADMIN_API_KEY` = `your-secure-key`
     - `RESEND_API_KEY` = `re_cSfXDoL4_3ojXujNSuP8vjFjKgqzV8tJG`
     - `FROM_EMAIL` = `FACILITAIR <onboarding@facilitair.ai>`

5. **Deploy**: Railway will automatically build and deploy

6. **Get Railway URL**: You'll get a URL like `facilitair-lp-production.up.railway.app`

### Step 3: Configure Cloudflare DNS

1. **Log into Cloudflare**: Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Select facilitair.ai domain**
3. **DNS Settings**:
   - Click "DNS" in the left sidebar
   - Add a **CNAME record**:
     - Type: `CNAME`
     - Name: `@` (for root domain) or `www`
     - Target: `facilitair-lp-production.up.railway.app` (your Railway URL)
     - Proxy status: Proxied (orange cloud)
     - TTL: Auto

4. **Add both records**:
   ```
   CNAME @ facilitair-lp-production.up.railway.app (Proxied)
   CNAME www facilitair-lp-production.up.railway.app (Proxied)
   ```

### Step 4: Configure Custom Domain in Railway

1. **Railway Dashboard** → Your service → Settings tab
2. **Custom Domain**:
   - Click "Generate Domain" to get Railway domain
   - Click "Custom Domain"
   - Enter: `facilitair.ai`
   - Add another: `www.facilitair.ai`

3. **Wait for DNS propagation** (can take 5 minutes to 24 hours)

### Step 5: Configure SSL (Automatic with Cloudflare)

Cloudflare automatically provides SSL. Ensure:
1. **Cloudflare SSL/TLS settings**:
   - Go to SSL/TLS → Overview
   - Set to **"Full"** or **"Full (strict)"**

2. **Enable Always Use HTTPS**:
   - SSL/TLS → Edge Certificates
   - Toggle "Always Use HTTPS" to ON

### Step 6: Verify Domain in Resend

1. **Resend Dashboard**: Go to [resend.com/domains](https://resend.com/domains)
2. **Add Domain**: Click "Add Domain" → Enter `facilitair.ai`
3. **DNS Records**: Resend will show you DNS records to add
4. **Add to Cloudflare**:
   - Go back to Cloudflare DNS settings
   - Add the TXT, MX, and CNAME records provided by Resend
   - Example records:
     ```
     TXT resend._domainkey DKIM_VALUE_FROM_RESEND
     MX @ feedback-smtp.us-east-1.amazonses.com (Priority: 10)
     ```

5. **Verify**: Click "Verify" in Resend dashboard

6. **Update .env**: Change `FROM_EMAIL` to use your domain:
   ```env
   FROM_EMAIL=FACILITAIR <onboarding@facilitair.ai>
   ```

### Step 7: Test Production

1. Visit `https://facilitair.ai`
2. Submit email signup
3. Check email for confirmation
4. Click confirmation link
5. Complete survey

---

## Option 2: Render

Similar to Railway but with a slightly different interface.

### Deploy Steps:

1. **Sign up**: [render.com](https://render.com)
2. **New Web Service**:
   - Connect GitHub repository
   - Name: `facilitair-lp`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`

3. **Environment Variables**: Add same variables as Railway

4. **Custom Domain**:
   - Render → Your service → Settings → Custom Domain
   - Add `facilitair.ai` and `www.facilitair.ai`

5. **Cloudflare DNS**:
   - Add CNAME records pointing to Render URL
   - Same process as Railway

---

## Option 3: DigitalOcean App Platform

More control, slightly more complex.

### Deploy Steps:

1. **Create Account**: [cloud.digitalocean.com](https://cloud.digitalocean.com)
2. **App Platform**: Apps → Create App
3. **GitHub**: Connect repository
4. **Settings**:
   - Type: Web Service
   - Run Command: `node server.js`
   - HTTP Port: 3000

5. **Environment Variables**: Add variables
6. **Custom Domain**: Add facilitair.ai
7. **Cloudflare DNS**: Point to DigitalOcean App URL

---

## Database Persistence

**Important**: Railway/Render use ephemeral filesystems - SQLite database will reset on deploys!

### Solutions:

**Option A: Railway Persistent Volume** (Recommended)
1. Railway → Service → Settings → Volumes
2. Add volume mounted at `/app/data`
3. Update server.js to use `/app/data/facilitair-emails.db`

**Option B: External Database** (Production-grade)
1. Use PostgreSQL instead of SQLite
2. Railway provides free PostgreSQL addon
3. Update code to use PostgreSQL (install `pg` package)

**Quick Fix for Railway Volume**:
```javascript
// In server.js, change:
const db = new Database('facilitair-emails.db');

// To:
const dbPath = process.env.NODE_ENV === 'production'
  ? '/app/data/facilitair-emails.db'
  : 'facilitair-emails.db';
const db = new Database(dbPath);
```

---

## Environment Variables Checklist

Make sure all these are set in your hosting platform:

```env
NODE_ENV=production
PORT=3000
BASE_URL=https://facilitair.ai
ADMIN_API_KEY=<generate with: openssl rand -hex 32>
RESEND_API_KEY=re_cSfXDoL4_3ojXujNSuP8vjFjKgqzV8tJG
FROM_EMAIL=FACILITAIR <onboarding@facilitair.ai>
```

---

## Post-Deployment Checklist

- [ ] Site loads at https://facilitair.ai
- [ ] Email signup works
- [ ] Confirmation email received
- [ ] Confirmation link works
- [ ] Welcome + survey email received
- [ ] Survey submission works
- [ ] Database persists between visits
- [ ] SSL certificate valid
- [ ] All images/assets load
- [ ] Mobile responsive
- [ ] Admin API requires correct key

---

## Monitoring & Maintenance

### Railway:
- **Logs**: Railway → Service → Deployments → View Logs
- **Metrics**: Service → Metrics (CPU, Memory, Network)
- **Alerts**: Configure in Settings

### Check Emails:
- **Resend Dashboard**: [resend.com/emails](https://resend.com/emails)
- Monitor delivery rates, opens, bounces

### Database Backups:
```bash
# SSH into Railway (if needed)
railway run sqlite3 facilitair-emails.db .dump > backup.sql

# Or download locally via Railway CLI
railway run cat facilitair-emails.db > backup.db
```

---

## Costs

### Railway:
- **Free Tier**: $5/month credit (enough for small projects)
- **Pro**: $20/month (includes $20 credit + more resources)
- Charges: ~$5-10/month for basic app

### Resend:
- **Free**: 3,000 emails/month
- **Pro**: $20/month for 50,000 emails

### Cloudflare:
- **Free**: SSL, DNS, basic DDoS protection
- **Pro**: $20/month (optional, adds features)

### Total Estimate:
- **Free tier**: ~$0-5/month (Railway free tier + Resend free)
- **Paid tier**: ~$20-30/month (Railway Pro + Resend if needed)

---

## Quick Start Command Summary

```bash
# 1. Ensure .env is configured for production
# 2. Push to GitHub (covered in next section)

# 3. Deploy to Railway
# - Sign up at railway.app
# - Connect GitHub repo
# - Add environment variables
# - Deploy

# 4. Configure Cloudflare DNS
# - Add CNAME @ pointing to Railway URL
# - Add CNAME www pointing to Railway URL
# - Enable SSL (Full mode)

# 5. Verify Resend domain
# - Add DNS records to Cloudflare
# - Verify in Resend dashboard

# 6. Test!
# - Visit https://facilitair.ai
# - Sign up for beta
```

---

## Troubleshooting

### Site Not Loading
- Check Cloudflare DNS records are correct
- Verify Railway deployment succeeded
- Check Railway logs for errors

### Emails Not Sending
- Verify Resend API key is set
- Check domain is verified in Resend
- Review Railway logs for email errors

### Database Lost After Deploy
- Add persistent volume in Railway
- Update database path in server.js

### SSL Errors
- Ensure Cloudflare SSL mode is "Full"
- Wait for SSL certificate to provision (can take 15 minutes)

---

Need help? Check Railway docs or Resend docs, or contact:
- Railway: [railway.app/help](https://railway.app/help)
- Resend: [resend.com/docs](https://resend.com/docs)
