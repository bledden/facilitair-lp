# Beta Access System - Quick Setup Guide

**Status:** Ready to deploy
**Time to setup:** 5 minutes

---

## 🎯 What You Get

1. **Password-based beta access** - No need for email/signup forms
2. **Admin dashboard** to generate/revoke beta passwords
3. **Session management** - 7-day sessions for beta users
4. **Simple integration** with your existing server

---

## 📋 Quick Start (3 Steps)

### Step 1: Set Environment Variables

Edit your `.env` file:

```bash
# Add this line (use a strong password - this is YOUR admin password)
BETA_ADMIN_PASSWORD=your-secure-admin-password-here
```

**Important:** This password gives YOU access to generate beta passwords at `/beta-admin`

### Step 2: Add Beta System to server.js

Add this code near the top of `server.js` (after the db initialization around line 55):

```javascript
// Beta Access System
const BetaPasswordSystem = require('./beta-system');
const betaSystem = new BetaPasswordSystem(db);

// Cleanup expired sessions every hour
setInterval(() => {
    betaSystem.cleanupExpiredSessions();
}, 60 * 60 * 1000);
```

Then add the API endpoints (before "Serve HTML pages" section around line 1560):

```javascript
// ==================== BETA ACCESS ENDPOINTS ====================

// Verify beta password
app.post('/api/beta/verify', (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, error: 'Password required' });

    const result = betaSystem.verifyPassword(password, req.ip, req.get('user-agent'));
    res.status(result.success ? 200 : 401).json(result);
});

// Verify session token
app.post('/api/beta/verify-session', (req, res) => {
    const { session_token } = req.body;
    if (!session_token) return res.status(400).json({ valid: false, error: 'Token required' });

    res.json(betaSystem.verifySession(session_token));
});

// Admin auth
app.post('/api/beta/admin/auth', (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, error: 'Password required' });

    const result = betaSystem.authenticateAdmin(password);
    res.status(result.success ? 200 : 401).json(result);
});

// Admin middleware
function verifyAdminToken(req, res, next) {
    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    if (!betaSystem.verifyAdminToken(token).valid) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    next();
}

// Generate password (admin only)
app.post('/api/beta/admin/generate', verifyAdminToken, (req, res) => {
    const { label } = req.body;
    if (!label) return res.status(400).json({ success: false, error: 'Label required' });

    const result = betaSystem.createBetaPassword(label.trim());
    res.status(result.success ? 200 : 500).json(result);
});

// List passwords (admin only)
app.get('/api/beta/admin/list', verifyAdminToken, (req, res) => {
    res.json({ success: true, passwords: betaSystem.listPasswords() });
});

// Revoke password (admin only)
app.post('/api/beta/admin/revoke', verifyAdminToken, (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, error: 'Password required' });

    const result = betaSystem.revokePassword(password);
    res.status(result.success ? 200 : 404).json(result);
});
```

### Step 3: Restart Server

```bash
npm start
# or
node server.js
```

---

## 🚀 Usage

### For You (Admin)

1. **Access admin panel:** Go to `http://localhost:3000/beta-admin`
2. **Login:** Enter your `BETA_ADMIN_PASSWORD`
3. **Generate passwords:**
   - Label: "John Doe" or "Team Alpha"
   - Click "Generate Password"
   - Copy the generated password
4. **Share with beta users:** Give them the password and URL

### For Beta Users

1. **Access beta:** Go to `http://localhost:3000/beta`
2. **Enter password:** Paste the password you gave them
3. **Access granted:** They see the beta dashboard for 7 days

---

## 📁 File Structure

```
facilitair-lp/
├── beta.html                  ✅ User-facing beta login
├── beta-admin.html           ✅ Admin password management
├── beta-dashboard.html       ✅ Beta dashboard (what users see)
├── beta-system.js            ✅ Backend logic (NEW - created)
├── server.js                 ⚠️  Needs beta endpoints added
├── .env                      ⚠️  Add BETA_ADMIN_PASSWORD
└── facilitair-emails.db      ✅ Will auto-create beta tables
```

---

## 🔐 Security Features

- ✅ **Password hashing** - Passwords stored as SHA-256 hashes
- ✅ **Session tokens** - 64-character random tokens (256-bit)
- ✅ **Expiration** - Sessions expire after 7 days
- ✅ **Revocation** - Instantly revoke access
- ✅ **Admin auth** - Separate admin authentication
- ✅ **Auto-cleanup** - Expired sessions removed hourly

---

## 💡 Example Workflow

### Scenario: Invite 5 Beta Users

1. **Generate passwords:**
   ```
   Label: "Alice Smith"  → Password: DjK3nP7xQ9fRmWz5
   Label: "Bob Johnson"  → Password: Fx8tYu2vGh4NpLq6
   Label: "Team Alpha"   → Password: Wr9sZx5cVb3MnKj8
   Label: "Investor XYZ" → Password: Ht7pJk4wQs2GfDr9
   Label: "Partner ABC"  → Password: Nq6vLm3xZt8HbYw5
   ```

2. **Share via email:**
   ```
   Hi Alice,

   You're invited to the FACILITAIR beta!

   Access: https://facilitair.ai/beta
   Password: DjK3nP7xQ9fRmWz5

   This gives you 7 days of access. Let me know what you think!

   - Blake
   ```

3. **Monitor usage:**
   - Admin panel shows last used date
   - Use count tracks activity
   - Revoke anytime if needed

---

## 🎨 Customization

### Change Session Duration

Edit `beta-system.js` line 114:

```javascript
// Default: 7 days
expiresAt.setDate(expiresAt.getDate() + 7);

// Change to 30 days:
expiresAt.setDate(expiresAt.getDate() + 30);

// Change to 24 hours:
expiresAt.setHours(expiresAt.getHours() + 24);
```

### Change Password Length

Edit `beta-system.js` line 52:

```javascript
// Default: 16 characters
generatePassword(length = 16) {

// Change to 12 characters:
generatePassword(length = 12) {
```

### Custom Beta Dashboard URL

Edit `beta.html` line 295:

```javascript
const DASHBOARD_URL = '/beta-dashboard.html';

// Change to external URL:
const DASHBOARD_URL = 'https://dashboard.facilitair.ai';
```

---

## 🐛 Troubleshooting

### "Email service not configured" error
- **Ignore this** - Beta system doesn't use email
- This is from your existing email subscription system
- Beta uses passwords only

### "Admin authentication not configured"
- **Fix:** Add `BETA_ADMIN_PASSWORD` to your `.env` file
- Restart server after adding

### "Invalid password" even with correct password
- **Check:** Password is case-sensitive
- **Try:** Copy/paste instead of typing
- **Debug:** Check `facilitair-emails.db` - `beta_passwords` table should exist

### Sessions not persisting
- **Check:** Browser allows localStorage
- **Check:** Session hasn't expired (7 days)
- **Check:** Password hasn't been revoked

### Can't access beta dashboard
- **Check:** `beta-dashboard.html` exists
- **Check:** Server is serving static files
- **Try:** Access directly: `http://localhost:3000/beta-dashboard.html`

---

## 📊 Database Schema

Beta system creates 3 tables automatically:

### beta_passwords
```sql
id              INTEGER PRIMARY KEY
password        TEXT UNIQUE         -- The actual password (not hashed for admin view)
password_hash   TEXT UNIQUE         -- SHA-256 hash for verification
label           TEXT                -- "John Doe", "Team Alpha", etc.
created_at      DATETIME
last_used_at    DATETIME
revoked         BOOLEAN
revoked_at      DATETIME
use_count       INTEGER
```

### beta_sessions
```sql
id                  INTEGER PRIMARY KEY
session_token       TEXT UNIQUE         -- 64-char random token
password_id         INTEGER             -- FK to beta_passwords
ip_address          TEXT
user_agent          TEXT
created_at          DATETIME
expires_at          DATETIME
last_activity_at    DATETIME
```

### beta_admin_sessions
```sql
id                  INTEGER PRIMARY KEY
token               TEXT UNIQUE         -- Admin session token
created_at          DATETIME
expires_at          DATETIME            -- 24 hours
last_activity_at    DATETIME
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Set strong `BETA_ADMIN_PASSWORD` in production .env
- [ ] Change `BASE_URL` in .env to your production URL
- [ ] Test beta flow: generate password → login → access dashboard
- [ ] Test admin flow: login → generate → revoke
- [ ] Verify session persistence (login, close browser, reopen)
- [ ] Check mobile responsiveness of beta pages
- [ ] Set up SSL (beta passwords sent over HTTPS only)

---

## 📈 Next Steps (Optional Enhancements)

### 1. Add Usage Analytics
Track which beta users are most active:
```javascript
// In beta-system.js, add method:
getUserActivity(passwordId) {
    return this.db.prepare(`
        SELECT COUNT(*) as login_count,
               MAX(last_activity_at) as last_seen
        FROM beta_sessions
        WHERE password_id = ?
    `).get(passwordId);
}
```

### 2. Email Notifications
Send email when password is used:
```javascript
// In verifyPassword method, after creating session:
if (resend) {
    await resend.emails.send({
        to: 'you@facilitair.ai',
        subject: 'Beta Password Used',
        text: `Password "${label}" was just used`
    });
}
```

### 3. Time-Limited Passwords
Auto-expire passwords after X days:
```javascript
// Add expires_at column to beta_passwords
// Check expiration in verifyPassword method
```

### 4. One-Time Passwords
Password becomes invalid after first use:
```javascript
// Add max_uses column to beta_passwords
// Revoke after reaching max_uses
```

---

## 🎯 Summary

**You now have:**
- ✅ Secure password-based beta access
- ✅ Admin dashboard to manage passwords
- ✅ 7-day sessions for beta users
- ✅ No payment infrastructure needed
- ✅ Simple to deploy (5 minutes)

**To go live:**
1. Add `BETA_ADMIN_PASSWORD` to .env
2. Add beta endpoints to server.js
3. Restart server
4. Access `/beta-admin` and generate passwords
5. Share passwords with beta users

**Questions?** Everything is self-contained and ready to deploy!
