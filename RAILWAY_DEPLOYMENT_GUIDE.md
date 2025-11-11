# Railway Deployment Guide for Beta System

Complete guide to deploying the facilitair landing page with beta password system to Railway.

## Table of Contents

1. [Quick Deploy](#quick-deploy)
2. [Environment Variables](#environment-variables)
3. [Database Persistence](#database-persistence)
4. [SSL & Security](#ssl--security)
5. [Monitoring & Logs](#monitoring--logs)
6. [Troubleshooting](#troubleshooting)
7. [Cost Optimization](#cost-optimization)

---

## Quick Deploy

### Prerequisites

- Railway account ([railway.app](https://railway.app))
- GitHub repository with your code
- `railway` CLI installed (optional but recommended)

```bash
npm install -g @railway/cli
railway login
```

### One-Click Deploy

```bash
# 1. Link your project to Railway
railway link

# 2. Deploy
railway up

# 3. Set environment variables (see below)
railway variables set BETA_ADMIN_PASSWORD=your-secure-password

# 4. Open your app
railway open
```

---

## Environment Variables

### Required Variables

Set these in Railway dashboard or via CLI:

```bash
# Beta system admin password (CRITICAL - use strong password!)
railway variables set BETA_ADMIN_PASSWORD=your-secure-admin-password

# Email service (Resend)
railway variables set RESEND_API_KEY=re_xxxxxxxxxxxxx

# Admin API key (for newsletter management)
railway variables set ADMIN_API_KEY=your-admin-api-key

# Port (automatically set by Railway, but can override)
# railway variables set PORT=3000
```

### Generate Secure Passwords

```bash
# Generate secure admin password
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32

# Or use Railway's secret generator in the dashboard
```

### Verify Variables

```bash
# List all environment variables
railway variables

# Should show:
# BETA_ADMIN_PASSWORD=***
# RESEND_API_KEY=re_***
# ADMIN_API_KEY=***
# PORT=3000 (automatically set)
# RAILWAY_ENVIRONMENT=production
```

---

## Database Persistence

Railway uses **ephemeral filesystems** by default. The beta system uses SQLite, so we need persistent storage.

### Option 1: Railway Volumes (Recommended)

Railway provides volumes for persistent data.

#### 1. Add Volume in `railway.toml`

Create `railway.toml` in project root:

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[volumes]]
name = "data"
mountPath = "/app/data"
```

#### 2. Update server.js to use volume

```javascript
const path = require('path');

// Use Railway volume if available
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || './';
const DB_PATH = path.join(DATA_DIR, 'subscribers.db');

const db = new Database(DB_PATH);
```

#### 3. Deploy with volume

```bash
railway up
```

The database will now persist across deployments.

### Option 2: External Database (PostgreSQL)

For production, consider PostgreSQL:

```bash
# Add PostgreSQL to your Railway project
railway add -d postgres

# Update database connection in server.js
# (requires converting from SQLite to PostgreSQL)
```

### Backup Strategy

**Important:** Even with volumes, implement backups!

```bash
# Add backup script to package.json
"scripts": {
  "backup": "node backup-db.js"
}
```

Create `backup-db.js`:

```javascript
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'subscribers.db')
  : 'subscribers.db';

const BACKUP_PATH = `backup-${Date.now()}.db`;

// Create backup
const db = new Database(DB_PATH, { readonly: true });
db.backup(BACKUP_PATH).then(() => {
  console.log(`✅ Backup created: ${BACKUP_PATH}`);

  // Upload to S3, Railway volume, or external storage
  // (implementation depends on your backup solution)
});
```

Run daily via Railway cron (requires Pro plan) or external scheduler.

---

## SSL & Security

### Automatic HTTPS

Railway automatically provides:
- SSL certificate via Let's Encrypt
- HTTPS endpoints
- Custom domain support

### Security Headers

The beta system already includes helmet.js, but verify in server.js:

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // For inline styles
      scriptSrc: ["'self'", "'unsafe-inline'"], // For inline scripts
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));
```

### Rate Limiting

Ensure rate limiting is configured (already in server.js):

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
```

Set `ALLOWED_ORIGINS` in Railway:

```bash
railway variables set ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## Monitoring & Logs

### View Logs

```bash
# Live logs
railway logs

# Recent logs
railway logs --recent

# Filter by service
railway logs -s facilitair-lp
```

### Health Check Endpoint

Railway automatically monitors your app. Add explicit health check:

```javascript
app.get('/health', (req, res) => {
  // Check database connection
  try {
    const result = db.prepare('SELECT 1').get();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### Metrics to Monitor

1. **Request Count**: Check `/health` endpoint
2. **Session Count**: Query `beta_sessions` table
3. **Active Passwords**: Query `beta_passwords` where `revoked = 0`
4. **Error Rate**: Monitor Railway logs for errors

### Set Up Alerts

In Railway dashboard:
1. Go to Settings → Notifications
2. Add webhook URL (Slack, Discord, etc.)
3. Configure alert thresholds:
   - CPU > 80%
   - Memory > 512MB
   - Deployment failures

---

## Troubleshooting

### Common Issues

#### 1. Database Not Found

**Symptom**: `SQLITE_CANTOPEN: unable to open database file`

**Solution**: Ensure volume is mounted and path is correct

```javascript
// Debug: Log database path
console.log('Database path:', DB_PATH);
console.log('Volume mount:', process.env.RAILWAY_VOLUME_MOUNT_PATH);
```

#### 2. Environment Variables Not Loading

**Symptom**: `BETA_ADMIN_PASSWORD is not defined`

**Solution**:
```bash
# Verify variables are set
railway variables

# Re-deploy to pick up new variables
railway up
```

#### 3. Session Token Errors

**Symptom**: Sessions expire immediately

**Solution**: Check system time and timezone

```javascript
// Ensure UTC timestamps
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
```

#### 4. High Memory Usage

**Symptom**: App crashes with OOM (Out of Memory)

**Solution**:
- Upgrade Railway plan (more RAM)
- Implement database connection pooling
- Add cleanup interval for old sessions

```javascript
// Run cleanup more frequently
setInterval(() => {
  betaSystem.cleanupExpiredSessions();
}, 30 * 60 * 1000); // Every 30 minutes
```

#### 5. Slow Response Times

**Symptom**: API endpoints timeout

**Solution**: Add database indexes

```javascript
// In beta-system.js initDatabase()
db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_sessions_token
  ON beta_sessions(session_token)
`).run();

db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_sessions_expires
  ON beta_sessions(expires_at)
`).run();
```

### Debug Mode

Enable verbose logging:

```bash
railway variables set DEBUG=beta:*

# Or in server.js
process.env.DEBUG = 'beta:*';
```

Add debug logs:

```javascript
const debug = require('debug')('beta:system');

// In beta-system.js
debug('Password verified for user:', passwordId);
debug('Session created:', sessionToken);
debug('Cleanup removed %d sessions', result.changes);
```

---

## Cost Optimization

### Railway Pricing

- **Free Tier**: $0/month (500 hours execution)
- **Hobby**: $5/month (500 hours + $0.000463/min beyond)
- **Pro**: $20/month (usage-based pricing)

### Optimize Costs

#### 1. Reduce Build Time

```toml
# railway.toml
[build]
builder = "NIXPACKS"
watchPatterns = [
  "*.js",
  "package.json"
]
```

#### 2. Efficient Database Queries

```javascript
// Bad: Query entire table
const allPasswords = db.prepare('SELECT * FROM beta_passwords').all();

// Good: Query only what you need
const activePasswords = db.prepare(`
  SELECT password, label, created_at
  FROM beta_passwords
  WHERE revoked = 0
  LIMIT 100
`).all();
```

#### 3. Cache Static Responses

```javascript
const cache = new Map();

app.get('/api/beta/admin/stats', verifyAdminToken, (req, res) => {
  const cacheKey = 'admin_stats';
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 60000) {
    return res.json(cached.data);
  }

  const stats = {
    total: db.prepare('SELECT COUNT(*) FROM beta_passwords').pluck().get(),
    active: db.prepare('SELECT COUNT(*) FROM beta_passwords WHERE revoked = 0').pluck().get(),
    sessions: db.prepare('SELECT COUNT(*) FROM beta_sessions').pluck().get()
  };

  cache.set(cacheKey, { data: stats, timestamp: Date.now() });
  res.json(stats);
});
```

#### 4. Compress Responses

```javascript
const compression = require('compression');
app.use(compression());
```

#### 5. Clean Up Old Data

```javascript
// Delete sessions older than 30 days
setInterval(() => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('DELETE FROM beta_sessions WHERE expires_at < ?').run(cutoff);
}, 24 * 60 * 60 * 1000); // Daily
```

---

## Custom Domain Setup

### Add Custom Domain

1. **In Railway Dashboard**:
   - Go to Settings → Domains
   - Click "Add Domain"
   - Enter your domain (e.g., `beta.facilitair.com`)

2. **Update DNS**:
   - Add CNAME record pointing to Railway:
     ```
     beta.facilitair.com → your-app.railway.app
     ```

3. **Wait for SSL**:
   - Railway automatically provisions SSL certificate
   - Usually takes 2-5 minutes

4. **Update Environment**:
   ```bash
   railway variables set ALLOWED_ORIGINS=https://beta.facilitair.com
   ```

---

## Deployment Checklist

Before going live:

- [ ] Environment variables set (BETA_ADMIN_PASSWORD, RESEND_API_KEY, ADMIN_API_KEY)
- [ ] Volume configured for database persistence
- [ ] Health check endpoint responding
- [ ] SSL certificate active
- [ ] Custom domain configured (optional)
- [ ] Rate limiting enabled
- [ ] Security headers configured (helmet.js)
- [ ] CORS properly restricted
- [ ] Backup strategy implemented
- [ ] Error monitoring set up
- [ ] Test beta password flow end-to-end
- [ ] Admin login working
- [ ] User beta access working
- [ ] Session persistence verified
- [ ] Password revocation tested

---

## Post-Deployment Testing

```bash
# 1. Test health endpoint
curl https://your-app.railway.app/health

# 2. Test admin authentication
curl -X POST https://your-app.railway.app/api/beta/admin/auth \
  -H "Content-Type: application/json" \
  -d '{"password":"your-admin-password"}'

# 3. Generate test password
curl -X POST https://your-app.railway.app/api/beta/admin/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"label":"Production Test"}'

# 4. Test user login
curl -X POST https://your-app.railway.app/api/beta/verify \
  -H "Content-Type: application/json" \
  -d '{"password":"generated-password"}'

# 5. Run full test suite
bash test-beta-system.sh
```

---

## Rollback Procedure

If something goes wrong:

```bash
# 1. View recent deployments
railway deployments

# 2. Rollback to previous version
railway rollback

# 3. Or specify deployment ID
railway rollback d-abc123

# 4. Verify rollback
railway logs --recent
```

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Beta System Docs**: See `BETA_SETUP_GUIDE.md`
- **Testing**: See `test-beta-system.sh`

---

## Summary

**Deployment Steps**:
1. Push code to GitHub
2. Link Railway project: `railway link`
3. Set environment variables: `railway variables set`
4. Configure volume in `railway.toml`
5. Deploy: `railway up`
6. Test: `bash test-beta-system.sh`
7. Monitor: `railway logs`

**Key Files**:
- `server.js` - Main application
- `beta-system.js` - Beta password logic
- `beta-endpoints.js` - API endpoints
- `railway.toml` - Railway configuration
- `.env` - Local environment (not deployed)

**Security Checklist**:
- ✅ Strong BETA_ADMIN_PASSWORD set
- ✅ HTTPS enabled (automatic)
- ✅ Rate limiting configured
- ✅ Helmet.js security headers
- ✅ Database persistence via volume
- ✅ Regular session cleanup

🚀 Your beta system is now deployed and secured on Railway!
