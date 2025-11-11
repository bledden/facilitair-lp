// FACILITAIR Beta Access API Endpoints
// Add this to your server.js

module.exports = function setupBetaEndpoints(app, betaSystem) {
    // Beta API: Verify password and create session
    app.post('/api/beta/verify', (req, res) => {
        try {
            const { password } = req.body;
            if (!password) {
                return res.status(400).json({ success: false, error: 'Password required' });
            }

            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('user-agent');
            const result = betaSystem.verifyPassword(password, ipAddress, userAgent);

            res.status(result.success ? 200 : 401).json(result);
        } catch (error) {
            console.error('Beta verify error:', error);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    });

    // Beta API: Verify session token
    app.post('/api/beta/verify-session', (req, res) => {
        try {
            const { session_token } = req.body;
            if (!session_token) {
                return res.status(400).json({ valid: false, error: 'Token required' });
            }

            const result = betaSystem.verifySession(session_token);
            res.json(result);
        } catch (error) {
            console.error('Beta session verify error:', error);
            res.status(500).json({ valid: false, error: 'Server error' });
        }
    });

    // Beta Admin: Authenticate
    app.post('/api/beta/admin/auth', (req, res) => {
        try {
            const { password } = req.body;
            if (!password) {
                return res.status(400).json({ success: false, error: 'Password required' });
            }

            const result = betaSystem.authenticateAdmin(password);
            res.status(result.success ? 200 : 401).json(result);
        } catch (error) {
            console.error('Admin auth error:', error);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    });

    // Admin middleware
    function verifyAdminToken(req, res, next) {
        const authHeader = req.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const token = authHeader.substring(7);
        const result = betaSystem.verifyAdminToken(token);

        if (!result.valid) {
            return res.status(401).json({ success: false, error: 'Invalid or expired token' });
        }

        next();
    }

    // Beta Admin: Generate password
    app.post('/api/beta/admin/generate', verifyAdminToken, (req, res) => {
        try {
            const { label } = req.body;
            if (!label || typeof label !== 'string' || label.trim().length === 0) {
                return res.status(400).json({ success: false, error: 'Label required' });
            }

            const result = betaSystem.createBetaPassword(label.trim());
            res.status(result.success ? 200 : 500).json(result);
        } catch (error) {
            console.error('Generate password error:', error);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    });

    // Beta Admin: List all passwords
    app.get('/api/beta/admin/list', verifyAdminToken, (req, res) => {
        try {
            const passwords = betaSystem.listPasswords();
            res.json({ success: true, passwords });
        } catch (error) {
            console.error('List passwords error:', error);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    });

    // Beta Admin: Revoke password
    app.post('/api/beta/admin/revoke', verifyAdminToken, (req, res) => {
        try {
            const { password } = req.body;
            if (!password) {
                return res.status(400).json({ success: false, error: 'Password required' });
            }

            const result = betaSystem.revokePassword(password);
            res.status(result.success ? 200 : 404).json(result);
        } catch (error) {
            console.error('Revoke password error:', error);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    });

    console.log('✅ Beta access endpoints registered');
};
