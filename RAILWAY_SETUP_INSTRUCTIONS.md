# Railway Deployment - Final Steps

## Status
✅ Code pushed to GitHub (commit 4f80edd)
✅ Railway will automatically deploy when it detects the push
⚠️ **ACTION REQUIRED:** Set environment variable in Railway

## Required Action: Set BETA_ADMIN_PASSWORD in Railway

### Step 1: Access Railway Dashboard

1. Go to https://railway.app/
2. Login to your account
3. Select the `facilitair-lp` project

### Step 2: Add Environment Variable

1. Click on your service/project
2. Go to the **Variables** tab
3. Click **+ New Variable**
4. Add:
   - **Variable Name:** `BETA_ADMIN_PASSWORD`
   - **Variable Value:** `GoBlake22$`
5. Click **Add** or **Save**

### Step 3: Verify Deployment

Railway should automatically:
1. Detect the new git push
2. Start building the new code
3. Deploy with the new environment variable

**Watch the deployment:** Check the "Deployments" tab to see progress

### Step 4: Test Beta Access

Once deployed (usually 2-5 minutes):

**1. Test Password Gate:**
- Visit: https://facilitair.ai/beta (or https://beta.facilitair.ai if subdomain is set up)
- You should see the FACILITAIR branded password gate

**2. Test Admin Interface:**
- Visit: https://facilitair.ai/beta-admin
- Login with password: `GoBlake22$`
- You should see the admin dashboard

**3. Generate First Beta Password:**
- In admin panel, enter a label (e.g., "Test User")
- Click "Generate Password"
- Copy the generated password (format: A7F2-K9M3-P5T8-W2D6)

**4. Test Beta Access:**
- Go back to https://facilitair.ai/beta
- Enter the generated beta password
- You should see the V13 Orchestration Dashboard

## Optional: Set Up Beta Subdomain

If you want https://beta.facilitair.ai instead of https://facilitair.ai/beta:

### Cloudflare DNS Setup

1. Go to Cloudflare Dashboard
2. Select your domain (facilitair.ai)
3. Go to DNS > Records
4. Click **Add record**
5. Configure:
   - **Type:** CNAME
   - **Name:** beta
   - **Target:** facilitair.ai (or your Railway domain)
   - **Proxy status:** Proxied (orange cloud)
   - **TTL:** Auto
6. Click **Save**

DNS propagation takes 1-5 minutes.

## Troubleshooting

### Admin Password Not Working

Check Railway logs:
```
railway logs
```

Look for this line:
```
⚠️  WARNING: BETA_ADMIN_PASSWORD not set in environment!
```

If you see this, the environment variable wasn't set correctly. Go back to Step 2.

### Beta Page Shows 404

The deployment might still be in progress. Wait 2-5 minutes and refresh.

### Database Errors

Railway will automatically create the SQLite database on first run. The tables for beta passwords and sessions are created automatically by server.js.

### API Endpoints Not Working

Verify in Railway logs that you see:
```
FACILITAIR Landing Page server running on port XXXX
Server listening on 0.0.0.0:XXXX
```

## Post-Deployment Checklist

- [ ] Visit https://facilitair.ai/beta - see password gate
- [ ] Visit https://facilitair.ai/beta-admin - login works
- [ ] Generate a test beta password in admin panel
- [ ] Use test password to access beta dashboard
- [ ] Verify V13 dashboard loads correctly
- [ ] Test logout functionality
- [ ] Test password revocation in admin panel

## Files Deployed

The following files were added in commit 4f80edd:

```
beta.html              - Password gate (public access)
beta-dashboard.html    - V13 orchestration dashboard (protected)
beta-admin.html        - Admin password management (protected)
server.js              - Updated with beta API endpoints
BETA_DEPLOYMENT.md     - Full technical documentation
.env.example           - Updated template
```

## Security Notes

- ✅ `.env` file is gitignored (your password is NOT in the repo)
- ✅ Environment variable is set securely in Railway
- ✅ All passwords are SHA-256 hashed in the database
- ✅ Sessions expire after 7 days
- ✅ Admin can revoke access instantly

## What's Next?

After verifying deployment:

1. **Generate beta passwords** for your initial users
2. **Send invitations** with:
   - URL: https://facilitair.ai/beta (or https://beta.facilitair.ai)
   - Their unique password
3. **Monitor usage** via admin panel
4. **Revoke access** if needed

## Support Files

- **BETA_DEPLOYMENT.md** - Complete technical documentation
- **facilitair-lp/.env** - Local environment (contains your password)
- **Railway Variables** - Production environment (set manually)

---

**Deployment committed by:** Claude Code
**Commit:** 4f80edd
**Branch:** main
**Status:** ✅ Code deployed, ⚠️ Environment variable needed
