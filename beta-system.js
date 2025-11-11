// FACILITAIR Beta Access System
// Secure password-based beta access with admin management

const crypto = require('crypto');

// Beta Password Management
class BetaPasswordSystem {
    constructor(db) {
        this.db = db;
        this.initDatabase();
    }

    initDatabase() {
        // Beta passwords table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS beta_passwords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                password TEXT UNIQUE NOT NULL,
                password_hash TEXT UNIQUE NOT NULL,
                label TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used_at DATETIME,
                revoked BOOLEAN DEFAULT 0,
                revoked_at DATETIME,
                use_count INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS beta_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_token TEXT UNIQUE NOT NULL,
                password_id INTEGER NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (password_id) REFERENCES beta_passwords(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS beta_admin_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_beta_password_hash ON beta_passwords(password_hash);
            CREATE INDEX IF NOT EXISTS idx_beta_session_token ON beta_sessions(session_token);
            CREATE INDEX IF NOT EXISTS idx_beta_admin_token ON beta_admin_sessions(token);
        `);
    }

    // Generate a secure random password
    generatePassword(length = 16) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let password = '';
        const randomBytes = crypto.randomBytes(length);

        for (let i = 0; i < length; i++) {
            password += chars[randomBytes[i] % chars.length];
        }

        return password;
    }

    // Hash password for storage
    hashPassword(password) {
        return crypto.createHash('sha256').update(password.toLowerCase().trim()).digest('hex');
    }

    // Generate session token
    generateSessionToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Create new beta password
    createBetaPassword(label) {
        const password = this.generatePassword();
        const passwordHash = this.hashPassword(password);

        try {
            const stmt = this.db.prepare(`
                INSERT INTO beta_passwords (password, password_hash, label)
                VALUES (?, ?, ?)
            `);

            const result = stmt.run(password, passwordHash, label);

            return {
                success: true,
                password,
                id: result.lastInsertRowid
            };
        } catch (error) {
            console.error('Error creating beta password:', error);
            return {
                success: false,
                error: 'Failed to create password'
            };
        }
    }

    // Verify beta password and create session
    verifyPassword(password, ipAddress = null, userAgent = null) {
        const passwordHash = this.hashPassword(password);

        try {
            // Find password
            const stmt = this.db.prepare(`
                SELECT id, revoked FROM beta_passwords
                WHERE password_hash = ?
            `);

            const passwordRecord = stmt.get(passwordHash);

            if (!passwordRecord) {
                return {
                    success: false,
                    error: 'Invalid password'
                };
            }

            if (passwordRecord.revoked) {
                return {
                    success: false,
                    error: 'Password has been revoked'
                };
            }

            // Update last used
            const updateStmt = this.db.prepare(`
                UPDATE beta_passwords
                SET last_used_at = CURRENT_TIMESTAMP,
                    use_count = use_count + 1
                WHERE id = ?
            `);
            updateStmt.run(passwordRecord.id);

            // Create session (expires in 7 days)
            const sessionToken = this.generateSessionToken();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            const sessionStmt = this.db.prepare(`
                INSERT INTO beta_sessions (session_token, password_id, ip_address, user_agent, expires_at)
                VALUES (?, ?, ?, ?, ?)
            `);

            sessionStmt.run(sessionToken, passwordRecord.id, ipAddress, userAgent, expiresAt.toISOString());

            return {
                success: true,
                session_token: sessionToken
            };
        } catch (error) {
            console.error('Error verifying password:', error);
            return {
                success: false,
                error: 'Verification failed'
            };
        }
    }

    // Verify session token
    verifySession(sessionToken) {
        try {
            const stmt = this.db.prepare(`
                SELECT
                    s.id,
                    s.password_id,
                    s.expires_at,
                    p.revoked
                FROM beta_sessions s
                JOIN beta_passwords p ON p.id = s.password_id
                WHERE s.session_token = ?
            `);

            const session = stmt.get(sessionToken);

            if (!session) {
                return { valid: false, error: 'Session not found' };
            }

            if (session.revoked) {
                return { valid: false, error: 'Password revoked' };
            }

            const expiresAt = new Date(session.expires_at);
            if (expiresAt < new Date()) {
                return { valid: false, error: 'Session expired' };
            }

            // Update last activity
            const updateStmt = this.db.prepare(`
                UPDATE beta_sessions
                SET last_activity_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `);
            updateStmt.run(session.id);

            return { valid: true };
        } catch (error) {
            console.error('Error verifying session:', error);
            return { valid: false, error: 'Verification failed' };
        }
    }

    // Get all beta passwords
    listPasswords() {
        try {
            const stmt = this.db.prepare(`
                SELECT
                    password,
                    label,
                    created_at,
                    last_used_at,
                    revoked,
                    revoked_at,
                    use_count
                FROM beta_passwords
                ORDER BY created_at DESC
            `);

            return stmt.all();
        } catch (error) {
            console.error('Error listing passwords:', error);
            return [];
        }
    }

    // Revoke beta password
    revokePassword(password) {
        const passwordHash = this.hashPassword(password);

        try {
            const stmt = this.db.prepare(`
                UPDATE beta_passwords
                SET revoked = 1, revoked_at = CURRENT_TIMESTAMP
                WHERE password_hash = ?
            `);

            const result = stmt.run(passwordHash);

            if (result.changes === 0) {
                return {
                    success: false,
                    error: 'Password not found'
                };
            }

            // Delete all sessions for this password
            const deleteSessionsStmt = this.db.prepare(`
                DELETE FROM beta_sessions
                WHERE password_id IN (
                    SELECT id FROM beta_passwords WHERE password_hash = ?
                )
            `);
            deleteSessionsStmt.run(passwordHash);

            return { success: true };
        } catch (error) {
            console.error('Error revoking password:', error);
            return {
                success: false,
                error: 'Failed to revoke password'
            };
        }
    }

    // Admin authentication
    authenticateAdmin(password) {
        const correctPassword = process.env.BETA_ADMIN_PASSWORD;

        if (!correctPassword) {
            console.error('BETA_ADMIN_PASSWORD not set in environment');
            return {
                success: false,
                error: 'Admin authentication not configured'
            };
        }

        if (password !== correctPassword) {
            return {
                success: false,
                error: 'Invalid admin password'
            };
        }

        // Create admin session (expires in 24 hours)
        const token = this.generateSessionToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        try {
            const stmt = this.db.prepare(`
                INSERT INTO beta_admin_sessions (token, expires_at)
                VALUES (?, ?)
            `);

            stmt.run(token, expiresAt.toISOString());

            return {
                success: true,
                token
            };
        } catch (error) {
            console.error('Error creating admin session:', error);
            return {
                success: false,
                error: 'Failed to create session'
            };
        }
    }

    // Verify admin token
    verifyAdminToken(token) {
        try {
            const stmt = this.db.prepare(`
                SELECT id, expires_at
                FROM beta_admin_sessions
                WHERE token = ?
            `);

            const session = stmt.get(token);

            if (!session) {
                return { valid: false };
            }

            const expiresAt = new Date(session.expires_at);
            if (expiresAt < new Date()) {
                return { valid: false };
            }

            // Update last activity
            const updateStmt = this.db.prepare(`
                UPDATE beta_admin_sessions
                SET last_activity_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `);
            updateStmt.run(session.id);

            return { valid: true };
        } catch (error) {
            console.error('Error verifying admin token:', error);
            return { valid: false };
        }
    }

    // Cleanup expired sessions (run periodically)
    cleanupExpiredSessions() {
        try {
            const stmt = this.db.prepare(`
                DELETE FROM beta_sessions
                WHERE expires_at < CURRENT_TIMESTAMP
            `);

            const result = stmt.run();

            const adminStmt = this.db.prepare(`
                DELETE FROM beta_admin_sessions
                WHERE expires_at < CURRENT_TIMESTAMP
            `);

            const adminResult = adminStmt.run();

            console.log(`Cleaned up ${result.changes} expired beta sessions and ${adminResult.changes} admin sessions`);
        } catch (error) {
            console.error('Error cleaning up sessions:', error);
        }
    }
}

module.exports = BetaPasswordSystem;
