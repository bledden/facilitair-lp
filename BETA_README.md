# Facilitair Beta Password System

Complete beta access system with password-based authentication, session management, and admin controls.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Automated Installation

```bash
bash install-beta-system.sh
```

This script will:
- ✅ Check all required files exist
- ✅ Create/update `.env` with secure admin password
- ✅ Backup your `server.js`
- ✅ Integrate beta system into `server.js`
- ✅ Validate syntax

### 3. Start Server

```bash
npm start
```

Server runs on `http://localhost:3000` (or `PORT` from `.env`)

### 4. Admin Login

1. Navigate to: `http://localhost:3000/beta-admin.html`
2. Login with `BETA_ADMIN_PASSWORD` from `.env`
3. Generate beta passwords for users

### 5. User Access

1. Share generated password with beta user
2. User navigates to: `http://localhost:3000/beta.html`
3. User enters password
4. User gets 7-day session access to beta dashboard

---

## 📋 Manual Installation

If you prefer manual integration:

### 1. Copy Files

Ensure these files are in your project:

```
facilitair-lp/
├── beta-system.js           # Core beta password logic
├── beta-endpoints.js        # API endpoints
├── beta.html               # User login page
├── beta-admin.html         # Admin management interface
├── server.js               # Your Express server (modify)
└── .env                    # Environment variables
```

### 2. Update server.js

See `beta-integration-patch.js` for exact code to add.

**Key additions:**

```javascript
// After database initialization
const BetaPasswordSystem = require('./beta-system');
const { setupBetaEndpoints } = require('./beta-endpoints');
const betaSystem = new BetaPasswordSystem(db);

// Before HTML serving routes
setupBetaEndpoints(app, betaSystem);
```

### 3. Set Environment Variables

Add to `.env`:

```env
BETA_ADMIN_PASSWORD=your-secure-password-here
RESEND_API_KEY=re_xxxxxxxxxxxxx
ADMIN_API_KEY=your-admin-api-key
PORT=3000
```

---

## 🧪 Testing

### Automated Testing

```bash
bash test-beta-system.sh
```

Runs comprehensive test suite:
- ✅ Admin authentication
- ✅ Password generation
- ✅ User password verification
- ✅ Session management
- ✅ Password revocation
- ✅ Edge cases & error handling

### Manual Testing

#### Test Admin Flow

```bash
# 1. Authenticate as admin
curl -X POST http://localhost:3000/api/beta/admin/auth \
  -H "Content-Type: application/json" \
  -d '{"password":"your-admin-password"}'

# Response: {"success":true,"token":"..."}

# 2. Generate beta password
curl -X POST http://localhost:3000/api/beta/admin/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"label":"Test User"}'

# Response: {"success":true,"password":"ABC123XYZ","id":1}
```

#### Test User Flow

```bash
# 1. Verify beta password
curl -X POST http://localhost:3000/api/beta/verify \
  -H "Content-Type: application/json" \
  -d '{"password":"ABC123XYZ"}'

# Response: {"success":true,"session_token":"...","expires_at":"..."}

# 2. Verify session
curl -X POST http://localhost:3000/api/beta/verify-session \
  -H "Content-Type: application/json" \
  -d '{"session_token":"your-session-token"}'

# Response: {"valid":true}
```

---

## 📊 Database Schema

The beta system creates three tables in your SQLite database:

### `beta_passwords`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| password | TEXT | Plain-text password (for display) |
| password_hash | TEXT | SHA-256 hash (for verification) |
| label | TEXT | Description (e.g., "User Name") |
| created_at | TEXT | ISO timestamp |
| last_used_at | TEXT | ISO timestamp (NULL if never used) |
| revoked | INTEGER | 0 = active, 1 = revoked |
| use_count | INTEGER | Number of times verified |

### `beta_sessions`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| session_token | TEXT | Unique session identifier |
| password_id | INTEGER | FK to beta_passwords |
| ip_address | TEXT | User's IP (for tracking) |
| user_agent | TEXT | Browser info |
| created_at | TEXT | ISO timestamp |
| expires_at | TEXT | ISO timestamp (7 days) |

### `beta_admin_sessions`

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| token | TEXT | Admin session token |
| created_at | TEXT | ISO timestamp |
| expires_at | TEXT | ISO timestamp (24 hours) |

---

## 🔐 Security Features

### Password Hashing

- SHA-256 hashing for password storage
- Case-insensitive verification (hashed lowercase)
- No ambiguous characters in generated passwords

### Session Management

- 7-day user sessions
- 24-hour admin sessions
- Automatic cleanup of expired sessions
- IP address and user agent tracking

### Rate Limiting

- Express rate limiter on all `/api/` endpoints
- Default: 100 requests per 15 minutes per IP

### Security Headers

- Helmet.js for security headers
- CORS configuration
- Content Security Policy

### Audit Trail

- Tracks password usage count
- Records last used timestamp
- Logs IP addresses and user agents
- Revocation functionality

---

## 📁 File Descriptions

### Core Files

**`beta-system.js`** (316 lines)
- `BetaPasswordSystem` class
- Database initialization
- Password generation, hashing, verification
- Session management
- Admin authentication

**`beta-endpoints.js`** (250+ lines)
- Express API routes
- Middleware for admin token verification
- Error handling
- Request validation

**`beta.html`**
- User-facing login page
- Session management via localStorage
- iFrame-based dashboard loading
- Auto-logout on session expiry

**`beta-admin.html`**
- Admin dashboard
- Password generation interface
- Password management (list, revoke)
- Statistics display

### Documentation

**`BETA_SETUP_GUIDE.md`**
- Comprehensive setup instructions
- Security features explanation
- Customization options
- Troubleshooting guide

**`RAILWAY_DEPLOYMENT_GUIDE.md`**
- Railway-specific deployment steps
- Environment variable configuration
- Database persistence setup
- Monitoring and cost optimization

**`BETA_README.md`** (this file)
- Quick start guide
- Testing instructions
- API reference

### Automation Scripts

**`install-beta-system.sh`**
- Automated integration script
- Backup creation
- Environment setup
- Syntax validation

**`test-beta-system.sh`**
- Comprehensive test suite
- 20+ automated tests
- Edge case coverage
- Summary reporting

**`beta-integration-patch.js`**
- Manual integration guide
- Code snippets
- Verification checklist
- Troubleshooting tips

---

## 🌐 API Reference

### Public Endpoints

#### `POST /api/beta/verify`

Verify a beta password and create session.

**Request:**
```json
{
  "password": "ABC123XYZ"
}
```

**Response (200):**
```json
{
  "success": true,
  "session_token": "def456...",
  "expires_at": "2025-01-20T12:00:00.000Z"
}
```

**Errors:**
- `400` - Missing or empty password
- `401` - Invalid or revoked password

#### `POST /api/beta/verify-session`

Verify an existing session token.

**Request:**
```json
{
  "session_token": "def456..."
}
```

**Response (200):**
```json
{
  "valid": true
}
```

**Errors:**
- `400` - Missing session token
- `401` - Invalid or expired session

### Admin Endpoints

All admin endpoints require `Authorization: Bearer <token>` header.

#### `POST /api/beta/admin/auth`

Authenticate as admin.

**Request:**
```json
{
  "password": "your-admin-password"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "abc123...",
  "expires_at": "2025-01-14T12:00:00.000Z"
}
```

**Errors:**
- `400` - Missing password
- `401` - Invalid password

#### `POST /api/beta/admin/generate`

Generate new beta password.

**Request:**
```json
{
  "label": "John Doe - john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "password": "ABC123XYZ",
  "id": 1,
  "label": "John Doe - john@example.com",
  "created_at": "2025-01-13T12:00:00.000Z"
}
```

**Errors:**
- `400` - Missing label
- `401` - Invalid/missing admin token

#### `GET /api/beta/admin/list`

List all beta passwords.

**Response (200):**
```json
{
  "success": true,
  "passwords": [
    {
      "id": 1,
      "password": "ABC123XYZ",
      "label": "John Doe",
      "created_at": "2025-01-13T12:00:00.000Z",
      "last_used_at": "2025-01-13T14:30:00.000Z",
      "revoked": 0,
      "use_count": 5
    }
  ]
}
```

#### `POST /api/beta/admin/revoke`

Revoke a beta password.

**Request:**
```json
{
  "password": "ABC123XYZ"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password revoked and 3 sessions deleted"
}
```

**Errors:**
- `400` - Missing password
- `404` - Password not found
- `401` - Invalid/missing admin token

---

## 🔧 Customization

### Change Session Duration

In `beta-system.js`:

```javascript
// Default: 7 days
const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

// Change to 30 days
const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
```

### Change Admin Session Duration

```javascript
// Default: 24 hours
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

// Change to 1 hour
const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
```

### Change Password Length

```javascript
generatePassword(length = 16) {
  // Change default from 16 to 12
  return this.generatePassword(12);
}
```

### Add Email Notifications

In `beta-endpoints.js`, after password generation:

```javascript
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// After password generation
await resend.emails.send({
  from: 'beta@facilitair.com',
  to: extractEmailFromLabel(label),
  subject: 'Your Facilitair Beta Access',
  html: `<p>Your beta password: <strong>${result.password}</strong></p>`
});
```

### Custom Dashboard URL

In `beta.html`:

```javascript
// Change dashboard URL
const DASHBOARD_URL = 'https://app.facilitair.com/dashboard';
```

---

## 🚨 Troubleshooting

### Server Won't Start

**Error:** `Cannot find module './beta-system'`

**Solution:** Ensure `beta-system.js` and `beta-endpoints.js` are in the same directory as `server.js`

### Admin Login Fails

**Error:** Invalid password

**Solution:**
1. Check `.env` for `BETA_ADMIN_PASSWORD`
2. Ensure no extra spaces or quotes
3. Password is case-sensitive

### Database Locked

**Error:** `SQLITE_BUSY: database is locked`

**Solution:**
1. Close other connections to `subscribers.db`
2. Only run one instance of server
3. Check for zombie processes: `ps aux | grep node`

### Sessions Expire Immediately

**Error:** Session valid but expires_at is in past

**Solution:** Check system time and timezone settings

### High Memory Usage

**Solution:** Increase cleanup frequency in `server.js`:

```javascript
// Run every 10 minutes instead of every hour
setInterval(() => {
  betaSystem.cleanupExpiredSessions();
}, 10 * 60 * 1000);
```

---

## 📦 Deployment

### Local Development

```bash
npm install
bash install-beta-system.sh
npm start
```

### Railway (Production)

See `RAILWAY_DEPLOYMENT_GUIDE.md` for complete instructions.

**Quick Deploy:**

```bash
railway link
railway variables set BETA_ADMIN_PASSWORD=your-secure-password
railway up
```

### Other Platforms

- **Heroku**: Use Heroku Postgres instead of SQLite
- **Vercel**: Use Vercel Postgres or Upstash Redis
- **DigitalOcean**: Use managed PostgreSQL database
- **AWS**: Use RDS for PostgreSQL

For production, consider migrating from SQLite to PostgreSQL for better scalability.

---

## 📈 Monitoring

### Track Active Sessions

```sql
SELECT COUNT(*) FROM beta_sessions WHERE expires_at > datetime('now');
```

### Most Used Passwords

```sql
SELECT label, use_count, last_used_at
FROM beta_passwords
WHERE revoked = 0
ORDER BY use_count DESC
LIMIT 10;
```

### Recent Logins

```sql
SELECT bp.label, bs.created_at, bs.ip_address
FROM beta_sessions bs
JOIN beta_passwords bp ON bs.password_id = bp.id
ORDER BY bs.created_at DESC
LIMIT 20;
```

### Revoked Passwords

```sql
SELECT password, label, created_at
FROM beta_passwords
WHERE revoked = 1;
```

---

## 🆘 Support

### Documentation

- **Setup Guide**: `BETA_SETUP_GUIDE.md`
- **Deployment Guide**: `RAILWAY_DEPLOYMENT_GUIDE.md`
- **Integration Guide**: `beta-integration-patch.js`

### Testing

- **Run Tests**: `bash test-beta-system.sh`
- **Manual Tests**: See API Reference section

### Common Issues

See Troubleshooting section above.

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🎯 Next Steps

After installation:

1. ✅ Run `bash test-beta-system.sh` to verify everything works
2. ✅ Visit `http://localhost:3000/beta-admin.html` to test admin interface
3. ✅ Generate a test password and login at `beta.html`
4. ✅ Review `RAILWAY_DEPLOYMENT_GUIDE.md` for production deployment
5. ✅ Customize session durations, password length, etc. as needed
6. ✅ Set up monitoring for active sessions and usage

---

**Built for Facilitair - Multi-Agent AI Collaboration Platform**

For questions or issues, contact: blake@facilitair.ai
