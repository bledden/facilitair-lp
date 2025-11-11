/**
 * BETA SYSTEM INTEGRATION PATCH FOR server.js
 *
 * This file shows exactly what to add to server.js to integrate the beta password system.
 * Follow the instructions below to manually apply these changes.
 */

// ============================================================================
// STEP 1: Add require statements at the top of server.js (around line 20)
// ============================================================================
// ADD AFTER: const db = new Database('subscribers.db');

const BetaPasswordSystem = require('./beta-system');
const { setupBetaEndpoints } = require('./beta-endpoints');

// Initialize beta system
const betaSystem = new BetaPasswordSystem(db);

// Cleanup expired beta sessions every hour
setInterval(() => {
    try {
        betaSystem.cleanupExpiredSessions();
        console.log('[Beta System] Cleaned up expired sessions');
    } catch (error) {
        console.error('[Beta System] Error cleaning up sessions:', error);
    }
}, 60 * 60 * 1000); // Run every hour


// ============================================================================
// STEP 2: Add beta API endpoints (around line 1560, BEFORE "Serve HTML pages")
// ============================================================================
// ADD BEFORE: // Serve HTML pages

// ==================== BETA ACCESS SYSTEM ====================

setupBetaEndpoints(app, betaSystem);

console.log('[Beta System] Endpoints registered:');
console.log('  POST /api/beta/verify');
console.log('  POST /api/beta/verify-session');
console.log('  POST /api/beta/admin/auth');
console.log('  POST /api/beta/admin/generate');
console.log('  GET  /api/beta/admin/list');
console.log('  POST /api/beta/admin/revoke');


// ============================================================================
// STEP 3: Environment variable validation (OPTIONAL but recommended)
// ============================================================================
// ADD AFTER: require('dotenv').config();

// Validate required environment variables
const REQUIRED_ENV_VARS = [
    'RESEND_API_KEY',
    'ADMIN_API_KEY',
    'BETA_ADMIN_PASSWORD'
];

const missing = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);
if (missing.length > 0) {
    console.error('[STARTUP ERROR] Missing required environment variables:');
    missing.forEach(varName => console.error(`  - ${varName}`));
    console.error('\nPlease set these variables in your .env file');
    process.exit(1);
}


// ============================================================================
// COMPLETE MODIFIED server.js STRUCTURE
// ============================================================================

/*
YOUR server.js SHOULD NOW LOOK LIKE THIS:

require('dotenv').config();

// Environment variable validation
const REQUIRED_ENV_VARS = ['RESEND_API_KEY', 'ADMIN_API_KEY', 'BETA_ADMIN_PASSWORD'];
const missing = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);
if (missing.length > 0) {
    console.error('[STARTUP ERROR] Missing required environment variables:');
    missing.forEach(varName => console.error(`  - ${varName}`));
    process.exit(1);
}

const express = require('express');
const Database = require('better-sqlite3');
const { Resend } = require('resend');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Initialize database
const db = new Database('subscribers.db');

// Initialize beta system
const BetaPasswordSystem = require('./beta-system');
const { setupBetaEndpoints } = require('./beta-endpoints');
const betaSystem = new BetaPasswordSystem(db);

// Cleanup expired beta sessions every hour
setInterval(() => {
    try {
        betaSystem.cleanupExpiredSessions();
        console.log('[Beta System] Cleaned up expired sessions');
    } catch (error) {
        console.error('[Beta System] Error cleaning up sessions:', error);
    }
}, 60 * 60 * 1000);

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

// ... (existing middleware, database setup, etc.)

// ==================== BETA ACCESS SYSTEM ====================
setupBetaEndpoints(app, betaSystem);
console.log('[Beta System] Endpoints registered');

// ==================== SERVE HTML PAGES ====================
// ... (existing HTML serving routes)

*/


// ============================================================================
// VERIFICATION CHECKLIST
// ============================================================================

/*

After applying these changes, verify:

✅ server.js requires both beta-system.js and beta-endpoints.js
✅ BetaPasswordSystem is initialized with the database
✅ setupBetaEndpoints is called before HTML serving routes
✅ Cleanup interval is set up
✅ BETA_ADMIN_PASSWORD is set in .env
✅ Server starts without errors
✅ Navigate to /beta-admin.html and test admin login
✅ Generate a password and test user login at /beta.html

*/


// ============================================================================
// QUICK TEST COMMANDS
// ============================================================================

/*

# Test admin authentication
curl -X POST http://localhost:3000/api/beta/admin/auth \
  -H "Content-Type: application/json" \
  -d '{"password":"your-admin-password"}'

# Generate beta password (replace TOKEN with response from above)
curl -X POST http://localhost:3000/api/beta/admin/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"label":"Test User 1"}'

# Verify beta password
curl -X POST http://localhost:3000/api/beta/verify \
  -H "Content-Type: application/json" \
  -d '{"password":"generated-password-here"}'

# List all passwords
curl -X GET http://localhost:3000/api/beta/admin/list \
  -H "Authorization: Bearer TOKEN"

*/


// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/*

ISSUE: "Cannot find module './beta-system'"
FIX: Ensure beta-system.js and beta-endpoints.js are in the same directory as server.js

ISSUE: "BETA_ADMIN_PASSWORD is not defined"
FIX: Add BETA_ADMIN_PASSWORD=your-secure-password to .env file

ISSUE: Admin login fails
FIX: Password comparison is case-sensitive. Check exact password in .env

ISSUE: Sessions expire immediately
FIX: Check system time. Sessions are valid for 7 days from creation.

ISSUE: Database locked error
FIX: Ensure only one instance of server.js is running

ISSUE: "Cannot read property 'prepare' of undefined"
FIX: Ensure db is initialized before creating BetaPasswordSystem

*/


// ============================================================================
// DEPLOYMENT NOTES FOR RAILWAY
// ============================================================================

/*

When deploying to Railway:

1. DATABASE PERSISTENCE
   - Railway uses volumes for SQLite persistence
   - Ensure subscribers.db is in the volume mount path
   - Check RAILWAY_VOLUME_MOUNT_PATH environment variable

2. ENVIRONMENT VARIABLES
   Set in Railway dashboard:
   - BETA_ADMIN_PASSWORD (use Railway's secret generator)
   - RESEND_API_KEY
   - ADMIN_API_KEY
   - PORT (automatically set by Railway)

3. HEALTH CHECK
   Add this endpoint for Railway health checks:

   app.get('/health', (req, res) => {
       res.json({ status: 'ok', timestamp: new Date().toISOString() });
   });

4. DATABASE BACKUP
   Consider adding periodic backup to Railway volume or external storage

*/
