# FACILITAIR Beta Deployment Guide - this is a change for sydney

Complete guide for deploying the password-protected beta dashboard at https://beta.facilitair.ai

## Overview

The beta access system consists of:
1. **beta.html** - Password gate with Facilitair branding
2. **beta-dashboard.html** - V13 Orchestration Dashboard (the actual app)
3. **beta-admin.html** - Admin interface for password management
4. **Backend API** - Password verification and session management in server.js

## Architecture

```
User Flow:
1. Visit https://beta.facilitair.ai → beta.html (password gate)
2. Enter beta password
3. API verifies password → creates session token
4. Session stored in localStorage
5. Dashboard loads in iframe
6. Session validated on every page load

Admin Flow:
1. Visit https://beta.facilitair.ai/beta-admin → beta-admin.html
2. Enter admin password (set in BETA_ADMIN_PASSWORD env var)
3. Generate new beta passwords with labels
4. View all passwords, usage stats
5. Revoke passwords instantly
```

## Setup Instructions

### 1. Environment Variables

Add to your `.env` file:

```bash
# Beta Admin Password (YOU CONTROL THIS)
BETA_ADMIN_PASSWORD=your_secure_admin_password_here

# Example:
BETA_ADMIN_PASSWORD=MySecureAdmin2024!
```

**IMPORTANT:** Without this set, the server will generate a random password on startup. Check the console logs to find it.

### 2. File Structure

Ensure these files exist in `/facilitair-lp/`:

```
facilitair-lp/
├── beta.html              # Password gate (public)
├── beta-dashboard.html    # Orchestration dashboard (protected)
├── beta-admin.html        # Admin interface (protected)
├── server.js              # Updated with beta API endpoints
└── .env                   # Contains BETA_ADMIN_PASSWORD
```

### 3. Test Locally

```bash
# Navigate to project
cd /Users/bledden/Documents/facilitair-lp

# Install dependencies (if not already done)
npm install

# Start server
node server.js

# Server should start on port 3000
```

**Test URLs:**
- http://localhost:3000/beta - Beta password gate
- http://localhost:3000/beta-admin - Admin password management

### 4. Generate Your First Beta Password

1. Visit http://localhost:3000/beta-admin
2. Enter your BETA_ADMIN_PASSWORD
3. Enter a label (e.g., "John Doe" or "Team Alpha")
4. Click "Generate Password"
5. Copy the generated password (format: A7F2-K9M3-P5T8-W2D6)
6. Give this password to your beta user

### 5. Test Beta Access

1. Visit http://localhost:3000/beta
2. Enter the generated password
3. Should redirect to dashboard
4. Session persists for 7 days

## Cloudflare Configuration

### Option A: Subdomain (Recommended)

**For https://beta.facilitair.ai**

1. Go to Cloudflare DNS settings
2. Add CNAME record:
   ```
   Type: CNAME
   Name: beta
   Target: facilitair.ai (or your Railway domain)
   Proxy: Enabled (orange cloud)
   ```

3. Railway will automatically handle the subdomain

### Option B: Path-Based (Alternative)

Keep everything on https://facilitair.ai/beta

This already works with the current setup - no additional DNS needed.

## Railway Deployment

### 1. Update Environment Variables

In Railway dashboard:

```bash
BETA_ADMIN_PASSWORD=your_secure_admin_password
NODE_ENV=production
PORT=3000
RESEND_API_KEY=your_resend_key
CLOUDFLARE_API_TOKEN=your_cloudflare_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ZONE_ID=your_zone_id
```

### 2. Deploy

```bash
# Commit changes
git add .
git commit -m "Add beta password-protected dashboard"

# Push to deploy (if connected to Railway)
git push origin main
```

Or use Railway CLI:
```bash
railway up
```

### 3. Verify Deployment

After deployment:
1. Visit https://beta.facilitair.ai (or https://facilitair.ai/beta)
2. Should see password gate
3. Visit https://beta.facilitair.ai/beta-admin
4. Should see admin interface

## Security Features

### Password System

- **Format:** 4 groups of 4 characters (e.g., A7F2-K9M3-P5T8-W2D6)
- **Character Set:** No confusing characters (no 0, O, 1, I)
- **Storage:** SHA-256 hashed in SQLite database
- **Sessions:** 7-day expiration with automatic cleanup

### Admin Controls

- **Only You Control:** Admin password (BETA_ADMIN_PASSWORD)
- **Generate:** Create unique passwords with labels
- **Revoke:** Instantly invalidate passwords
- **Track:** See last used time for each password
- **Sessions:** All sessions invalidated when password revoked

### Session Management

- **Token:** 256-bit random session token
- **Storage:** Client-side (localStorage)
- **Expiration:** 7 days
- **Validation:** Checked on every page load
- **Cleanup:** Automatic hourly cleanup of expired sessions

## Database Schema

The server automatically creates these tables:

```sql
-- Beta passwords
CREATE TABLE beta_passwords (
    id INTEGER PRIMARY KEY,
    password TEXT UNIQUE,
    password_hash TEXT UNIQUE,
    label TEXT,
    created_at DATETIME,
    last_used_at DATETIME,
    revoked BOOLEAN DEFAULT 0,
    revoked_at DATETIME
);

-- Beta sessions
CREATE TABLE beta_sessions (
    id INTEGER PRIMARY KEY,
    session_token TEXT UNIQUE,
    password_id INTEGER,
    created_at DATETIME,
    expires_at DATETIME,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (password_id) REFERENCES beta_passwords(id)
);
```

## API Endpoints

### Public Endpoints

**POST /api/beta/verify**
- Verify beta password
- Returns session token
- Body: `{ "password": "A7F2-K9M3-P5T8-W2D6" }`

**POST /api/beta/verify-session**
- Verify session token is still valid
- Body: `{ "session_token": "..." }`

### Admin Endpoints (Require Authorization Header)

**POST /api/beta/admin/auth**
- Authenticate as admin
- Body: `{ "password": "your_admin_password" }`
- Returns: `{ "token": "..." }`

**POST /api/beta/admin/generate**
- Generate new beta password
- Headers: `Authorization: Bearer {admin_token}`
- Body: `{ "label": "John Doe" }`
- Returns: `{ "password": "A7F2-K9M3-P5T8-W2D6" }`

**GET /api/beta/admin/list**
- List all beta passwords
- Headers: `Authorization: Bearer {admin_token}`
- Returns array of passwords with stats

**POST /api/beta/admin/revoke**
- Revoke a beta password
- Headers: `Authorization: Bearer {admin_token}`
- Body: `{ "password": "A7F2-K9M3-P5T8-W2D6" }`

## Usage Workflow

### Inviting a Beta User

1. Go to https://beta.facilitair.ai/beta-admin
2. Login with your admin password
3. Generate password with user's name as label
4. Send them:
   ```
   Welcome to FACILITAIR Beta!

   Access URL: https://beta.facilitair.ai
   Password: A7F2-K9M3-P5T8-W2D6

   Your session will last 7 days.
   ```

### Revoking Access

1. Go to admin panel
2. Find the password in the list
3. Click "Revoke"
4. User's session immediately invalidated
5. They must re-enter password (which now fails)

### Monitoring Usage

Admin panel shows:
- Total passwords generated
- Active (non-revoked) passwords
- Revoked passwords
- Last used timestamp for each password

## Troubleshooting

### Admin Password Not Working

```bash
# Check server logs for the auto-generated password
# Or set it explicitly:
echo "BETA_ADMIN_PASSWORD=YourPassword123" >> .env

# Restart server
```

### Session Not Persisting

- Check browser localStorage
- Verify session hasn't expired (7 days)
- Check if password was revoked
- Clear browser cache and try again

### API Endpoint 404

- Verify server.js has been updated with beta endpoints
- Check server is running
- Verify Railway deployment completed

### Database Issues

The SQLite database is stored at:
- Local: `./facilitair-emails.db`
- Railway: `${RAILWAY_VOLUME_MOUNT_PATH}/facilitair-emails.db`

Tables are created automatically on first run.

## Security Best Practices

1. **Strong Admin Password:**
   - Use 20+ characters
   - Mix of letters, numbers, symbols
   - Store securely (password manager)

2. **Regular Audits:**
   - Review active passwords monthly
   - Revoke unused passwords
   - Monitor last_used_at timestamps

3. **Session Rotation:**
   - Consider shorter session expiration for sensitive environments
   - Currently set to 7 days (configurable in code)

4. **HTTPS Only:**
   - Cloudflare provides free SSL
   - Passwords sent over encrypted connection

5. **Rate Limiting:**
   - Consider adding rate limiting to /api/beta/verify
   - Prevents brute force attacks

## Customization

### Change Session Duration

In `server.js`, line ~1468:

```javascript
// Current: 7 days
expiresAt.setDate(expiresAt.getDate() + 7);

// Change to 1 day:
expiresAt.setDate(expiresAt.getDate() + 1);

// Change to 30 days:
expiresAt.setDate(expiresAt.getDate() + 30);
```

### Change Password Format

In `server.js`, `generateBetaPassword()` function (~line 1275):

```javascript
// Current: 4 groups of 4 (A7F2-K9M3-P5T8-W2D6)
for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {

// Change to 3 groups of 5:
for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 5; j++) {
```

### Update API URL

If your API runs on a different port, update in:
- beta.html: `const API_URL = '/api/beta';`
- beta-admin.html: `const API_URL = '/api/beta/admin';`
- beta-dashboard.html: `const API_BASE = 'http://localhost:8000';`

## Support

If you encounter issues:

1. Check server logs: `railway logs` or local console
2. Verify environment variables are set
3. Test locally first before deploying
4. Check Cloudflare DNS propagation (can take 5 minutes)

## Next Steps

After successful deployment:

1. Test the complete flow end-to-end
2. Generate passwords for initial beta users
3. Monitor usage through admin panel
4. Set up analytics/monitoring if needed
5. Consider adding email notifications for new access

---

**Built for FACILITAIR**
Password-protected beta access with complete admin control
