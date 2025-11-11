// FACILITAIR Landing Page - Email Subscription Server
// Secure SQLite database for email storage

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3000;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Middleware
app.use(cors());
app.use(express.json());

// URL rewrite middleware - Remove .html extensions
// This allows /about to serve about.html
app.use((req, res, next) => {
    // Skip API routes and files with extensions (except .html)
    if (req.path.startsWith('/api/') ||
        (path.extname(req.path) && path.extname(req.path) !== '.html')) {
        return next();
    }

    // If URL ends with .html, redirect to extensionless version (301 permanent)
    if (req.path.endsWith('.html')) {
        const newPath = req.path.slice(0, -5); // Remove .html
        return res.redirect(301, newPath);
    }

    // If URL doesn't have .html and the file exists with .html, serve it
    const htmlPath = path.join(__dirname, req.path + '.html');

    if (fs.existsSync(htmlPath)) {
        return res.sendFile(htmlPath);
    }

    next();
});

app.use(express.static(path.join(__dirname)));

// Initialize SQLite database
// Use Railway volume path if available, otherwise local path
const dbPath = process.env.RAILWAY_VOLUME_MOUNT_PATH
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'facilitair-emails.db')
    : 'facilitair-emails.db';
console.log(`Using database at: ${dbPath}`);
const db = new Database(dbPath);

// Create emails table with security features
db.exec(`
    CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        email_hash TEXT UNIQUE NOT NULL,
        subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT,
        confirmed BOOLEAN DEFAULT 0,
        confirmed_at DATETIME,
        confirmation_token TEXT UNIQUE,
        unsubscribe_token TEXT UNIQUE NOT NULL,
        survey_completed BOOLEAN DEFAULT 0,
        metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS user_surveys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subscriber_id INTEGER NOT NULL,
        planned_use TEXT,
        anticipated_usage TEXT,
        how_found TEXT,
        background TEXT,
        additional_info TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_email_hash ON subscribers(email_hash);
    CREATE INDEX IF NOT EXISTS idx_subscribed_at ON subscribers(subscribed_at);
    CREATE INDEX IF NOT EXISTS idx_confirmation_token ON subscribers(confirmation_token);
    CREATE INDEX IF NOT EXISTS idx_subscriber_survey ON user_surveys(subscriber_id);
`);

// Helper function to hash email (for duplicate detection without storing plaintext)
function hashEmail(email) {
    return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

// Helper function to generate unsubscribe token
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Validate email format
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Rate limiting (simple in-memory store)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute

function checkRateLimit(identifier) {
    const now = Date.now();
    const userRequests = rateLimitStore.get(identifier) || [];

    // Filter out old requests
    const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

    if (recentRequests.length >= RATE_LIMIT_MAX) {
        return false;
    }

    recentRequests.push(now);
    rateLimitStore.set(identifier, recentRequests);
    return true;
}

// Email templates
function getConfirmationEmailHTML(confirmationToken, email) {
    const confirmUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/confirm/${confirmationToken}`;
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your FACILITAIR Beta Subscription</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #100F0D; color: #FAFAFA;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #100F0D; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #1A1916; border: 1px solid rgba(92, 225, 230, 0.2); border-radius: 12px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, rgba(92, 225, 230, 0.1) 0%, rgba(92, 225, 230, 0.05) 100%); padding: 40px 30px; text-align: center; border-bottom: 1px solid rgba(92, 225, 230, 0.2);">
                            <h1 style="margin: 0; color: #5CE1E6; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">FACILITAIR</h1>
                            <p style="margin: 10px 0 0 0; color: rgba(250, 250, 250, 0.7); font-size: 14px;">Multi-Agent AI Collaboration Platform</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #FAFAFA; font-size: 24px; font-weight: 600;">Confirm Your Beta Access</h2>
                            <p style="margin: 0 0 20px 0; color: rgba(250, 250, 250, 0.8); font-size: 16px; line-height: 1.6;">
                                Thank you for your interest in FACILITAIR! We're excited to have you join us on this journey to revolutionize AI collaboration.
                            </p>
                            <p style="margin: 0 0 30px 0; color: rgba(250, 250, 250, 0.8); font-size: 16px; line-height: 1.6;">
                                Click the button below to confirm your email address and secure your spot on our beta waitlist:
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${confirmUrl}" style="display: inline-block; background: linear-gradient(135deg, #5CE1E6 0%, #4BA9AE 100%); color: #100F0D; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(92, 225, 230, 0.3);">
                                            Confirm Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0 0; color: rgba(250, 250, 250, 0.6); font-size: 14px; line-height: 1.6;">
                                Or copy and paste this link into your browser:<br>
                                <a href="${confirmUrl}" style="color: #5CE1E6; word-break: break-all;">${confirmUrl}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(92, 225, 230, 0.1); text-align: center;">
                            <p style="margin: 0 0 10px 0; color: rgba(250, 250, 250, 0.5); font-size: 12px;">
                                This confirmation was requested for ${email}
                            </p>
                            <p style="margin: 0 0 10px 0; color: rgba(250, 250, 250, 0.5); font-size: 12px;">
                                If you didn't request this, you can safely ignore this email.
                            </p>
                            <p style="margin: 0; color: rgba(250, 250, 250, 0.5); font-size: 12px;">
                                This is an automated email. Please do not reply. For questions, contact us via <a href="https://facilitair.ai" style="color: #5CE1E6; text-decoration: none;">facilitair.ai</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

function getFollowUpEmailHTML(surveyToken, email) {
    const surveyUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/survey.html?token=${surveyToken}`;
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to FACILITAIR - Share Your Story</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #100F0D; color: #FAFAFA;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #100F0D; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #1A1916; border: 1px solid rgba(92, 225, 230, 0.2); border-radius: 12px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, rgba(92, 225, 230, 0.1) 0%, rgba(92, 225, 230, 0.05) 100%); padding: 40px 30px; text-align: center; border-bottom: 1px solid rgba(92, 225, 230, 0.2);">
                            <h1 style="margin: 0; color: #5CE1E6; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Welcome to FACILITAIR!</h1>
                            <p style="margin: 10px 0 0 0; color: rgba(250, 250, 250, 0.7); font-size: 14px;">You're officially on the beta waitlist</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #FAFAFA; font-size: 24px; font-weight: 600;">Thank You for Joining the Journey</h2>
                            <p style="margin: 0 0 20px 0; color: rgba(250, 250, 250, 0.8); font-size: 16px; line-height: 1.6;">
                                Your email has been confirmed! You're now part of an exclusive group shaping the future of multi-agent AI collaboration.
                            </p>
                            <p style="margin: 0 0 20px 0; color: rgba(250, 250, 250, 0.8); font-size: 16px; line-height: 1.6;">
                                <strong style="color: #5CE1E6;">Help us build FACILITAIR for you.</strong> We'd love to learn more about your use case and how we can tailor the beta experience to your needs.
                            </p>
                            <p style="margin: 0 0 30px 0; color: rgba(250, 250, 250, 0.8); font-size: 16px; line-height: 1.6;">
                                Take 2 minutes to share your story:
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${surveyUrl}" style="display: inline-block; background: linear-gradient(135deg, #5CE1E6 0%, #4BA9AE 100%); color: #100F0D; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(92, 225, 230, 0.3);">
                                            Complete Survey (2 min)
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- What We'll Ask -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px; background-color: rgba(92, 225, 230, 0.05); border: 1px solid rgba(92, 225, 230, 0.15); border-radius: 8px; padding: 20px;">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 15px 0; color: #5CE1E6; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">We'll Ask About:</p>
                                        <ul style="margin: 0; padding-left: 20px; color: rgba(250, 250, 250, 0.8); font-size: 14px; line-height: 1.8;">
                                            <li>How you plan to use FACILITAIR</li>
                                            <li>Your anticipated usage patterns</li>
                                            <li>How you discovered us</li>
                                            <li>Your background (optional)</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0 0; color: rgba(250, 250, 250, 0.7); font-size: 14px; line-height: 1.6; font-style: italic;">
                                Your input directly influences our development roadmap. All responses are optional, but highly valued!
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(92, 225, 230, 0.1); text-align: center;">
                            <p style="margin: 0 0 10px 0; color: rgba(250, 250, 250, 0.5); font-size: 12px;">
                                Sent to ${email}
                            </p>
                            <p style="margin: 0; color: rgba(250, 250, 250, 0.5); font-size: 12px;">
                                This is an automated email. Please do not reply. For questions, contact us via <a href="https://facilitair.ai" style="color: #5CE1E6; text-decoration: none;">facilitair.ai</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

// Send confirmation email
async function sendConfirmationEmail(email, confirmationToken) {
    if (!resend) {
        console.log('Email service not configured. Confirmation link:', confirmationToken);
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'FACILITAIR <onboarding@facilitair.ai>',
            to: email,
            subject: 'Confirm Your FACILITAIR Beta Access',
            html: getConfirmationEmailHTML(confirmationToken, email)
        });

        if (error) {
            console.error('Email send error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error };
    }
}

// Send follow-up survey email
async function sendFollowUpEmail(email, unsubscribeToken) {
    if (!resend) {
        console.log('Email service not configured. Survey link:', unsubscribeToken);
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'FACILITAIR <team@facilitair.ai>',
            to: email,
            subject: 'Welcome to FACILITAIR - Share Your Story',
            html: getFollowUpEmailHTML(unsubscribeToken, email)
        });

        if (error) {
            console.error('Email send error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error };
    }
}

// API endpoint: Subscribe
app.post('/api/subscribe', (req, res) => {
    try {
        const { email } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || 'Unknown';

        // Rate limiting
        if (!checkRateLimit(ipAddress)) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.'
            });
        }

        // Validate email
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const emailHash = hashEmail(normalizedEmail);
        const unsubscribeToken = generateToken();
        const confirmationToken = generateToken();

        // Insert into database
        const stmt = db.prepare(`
            INSERT INTO subscribers (email, email_hash, ip_address, user_agent, unsubscribe_token, confirmation_token)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        try {
            stmt.run(normalizedEmail, emailHash, ipAddress, userAgent, unsubscribeToken, confirmationToken);

            // Send confirmation email
            sendConfirmationEmail(normalizedEmail, confirmationToken);

            res.json({
                success: true,
                message: 'Successfully subscribed! Check your email for confirmation.'
            });
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                // Email already subscribed
                res.json({
                    success: true,
                    message: 'This email is already subscribed!'
                });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// API endpoint: Confirm email
app.get('/api/confirm/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // Find subscriber by confirmation token
        const subscriber = db.prepare('SELECT * FROM subscribers WHERE confirmation_token = ?').get(token);

        if (!subscriber) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invalid Confirmation Link - FACILITAIR</title>
                    <style>
                        body {
                            font-family: 'Montserrat', sans-serif;
                            background: #100F0D;
                            color: #FAFAFA;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            padding: 20px;
                        }
                        .message {
                            text-align: center;
                            max-width: 500px;
                        }
                        h1 { color: #5CE1E6; }
                        a {
                            color: #5CE1E6;
                            text-decoration: none;
                        }
                    </style>
                </head>
                <body>
                    <div class="message">
                        <h1>Invalid Confirmation Link</h1>
                        <p>This confirmation link is invalid or has already been used.</p>
                        <p><a href="/">Return to homepage</a></p>
                    </div>
                </body>
                </html>
            `);
        }

        if (subscriber.confirmed) {
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Already Confirmed - FACILITAIR</title>
                    <style>
                        body {
                            font-family: 'Montserrat', sans-serif;
                            background: #100F0D;
                            color: #FAFAFA;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            padding: 20px;
                        }
                        .message {
                            text-align: center;
                            max-width: 500px;
                        }
                        h1 { color: #5CE1E6; }
                        a {
                            color: #5CE1E6;
                            text-decoration: none;
                        }
                    </style>
                </head>
                <body>
                    <div class="message">
                        <h1>Already Confirmed</h1>
                        <p>Your email has already been confirmed. You're all set!</p>
                        <p><a href="/">Return to homepage</a></p>
                    </div>
                </body>
                </html>
            `);
        }

        // Update subscriber as confirmed
        const updateStmt = db.prepare(`
            UPDATE subscribers
            SET confirmed = 1, confirmed_at = CURRENT_TIMESTAMP, confirmation_token = NULL
            WHERE id = ?
        `);
        updateStmt.run(subscriber.id);

        // Send follow-up survey email
        await sendFollowUpEmail(subscriber.email, subscriber.unsubscribe_token);

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Email Confirmed - FACILITAIR</title>
                <style>
                    body {
                        font-family: 'Montserrat', sans-serif;
                        background: #100F0D;
                        color: #FAFAFA;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 20px;
                    }
                    .message {
                        text-align: center;
                        max-width: 50%;
                        background: rgba(92, 225, 230, 0.05);
                        padding: 40px;
                        border-radius: 12px;
                        border: 1px solid rgba(92, 225, 230, 0.2);
                    }
                    h1 {
                        color: #5CE1E6;
                        margin-bottom: 20px;
                        font-size: 40px;
                    }
                    p {
                        color: rgba(250, 250, 250, 0.8);
                        line-height: 1.6;
                        margin-bottom: 15px;
                        font-size: 18px;
                    }
                    a {
                        color: #5CE1E6;
                        text-decoration: none;
                    }
                    .check-mark {
                        font-size: 60px;
                        color: #5CE1E6;
                        margin-bottom: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="message">
                    <div class="check-mark">✓</div>
                    <h1>Email Confirmed!</h1>
                    <p><strong>Welcome to the FACILITAIR beta waitlist!</strong></p>
                    <p>We've sent you a follow-up email with a quick survey. Your feedback will help us tailor the beta experience to your needs.</p>
                    <p style="margin-top: 30px;"><a href="/">← Return to homepage</a></p>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Confirmation error:', error);
        res.status(500).send('Server error');
    }
});

// API endpoint: Submit survey
app.post('/api/survey', (req, res) => {
    try {
        const { token, plannedUse, anticipatedUsage, howFound, background, additionalInfo } = req.body;

        // Validate token and find subscriber
        const subscriber = db.prepare('SELECT * FROM subscribers WHERE unsubscribe_token = ? AND confirmed = 1').get(token);

        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: 'Invalid survey link or email not confirmed'
            });
        }

        if (subscriber.survey_completed) {
            return res.json({
                success: true,
                message: 'Survey already completed. Thank you!'
            });
        }

        // Insert survey response
        const insertStmt = db.prepare(`
            INSERT INTO user_surveys (subscriber_id, planned_use, anticipated_usage, how_found, background, additional_info)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        insertStmt.run(subscriber.id, plannedUse, anticipatedUsage, howFound, background || null, additionalInfo || null);

        // Mark survey as completed
        const updateStmt = db.prepare('UPDATE subscribers SET survey_completed = 1 WHERE id = ?');
        updateStmt.run(subscriber.id);

        res.json({
            success: true,
            message: 'Thank you for completing the survey!'
        });
    } catch (error) {
        console.error('Survey submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// API endpoint: Unsubscribe
app.get('/api/unsubscribe/:token', (req, res) => {
    try {
        const { token } = req.params;

        const stmt = db.prepare('DELETE FROM subscribers WHERE unsubscribe_token = ?');
        const result = stmt.run(token);

        if (result.changes > 0) {
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Unsubscribed - FACILITAIR</title>
                    <style>
                        body {
                            font-family: 'Montserrat', sans-serif;
                            background: #100F0D;
                            color: #FAFAFA;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            padding: 20px;
                        }
                        .message {
                            text-align: center;
                            max-width: 500px;
                        }
                        h1 { color: #5CE1E6; }
                        a {
                            color: #5CE1E6;
                            text-decoration: none;
                        }
                    </style>
                </head>
                <body>
                    <div class="message">
                        <h1>Successfully Unsubscribed</h1>
                        <p>You've been removed from the FACILITAIR beta email list.</p>
                        <p><a href="/">Return to homepage</a></p>
                    </div>
                </body>
                </html>
            `);
        } else {
            res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invalid Token - FACILITAIR</title>
                    <style>
                        body {
                            font-family: 'Montserrat', sans-serif;
                            background: #100F0D;
                            color: #FAFAFA;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            padding: 20px;
                        }
                        .message {
                            text-align: center;
                            max-width: 500px;
                        }
                        h1 { color: #5CE1E6; }
                    </style>
                </head>
                <body>
                    <div class="message">
                        <h1>Invalid Unsubscribe Link</h1>
                        <p>This unsubscribe link is invalid or has already been used.</p>
                    </div>
                </body>
                </html>
            `);
        }
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).send('Server error');
    }
});

// API endpoint: Get stats (admin only - add authentication in production)
app.get('/api/stats', (req, res) => {
    try {
        // In production, add authentication here
        const apiKey = req.get('X-API-Key');
        if (apiKey !== process.env.ADMIN_API_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const total = db.prepare('SELECT COUNT(*) as count FROM subscribers').get();
        const confirmed = db.prepare('SELECT COUNT(*) as count FROM subscribers WHERE confirmed = 1').get();
        const recent = db.prepare(`
            SELECT COUNT(*) as count
            FROM subscribers
            WHERE subscribed_at > datetime('now', '-7 days')
        `).get();

        res.json({
            total: total.count,
            confirmed: confirmed.count,
            recentWeek: recent.count
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoint: Get survey responses (admin only)
app.get('/api/survey-responses', (req, res) => {
    try {
        // Authentication required
        const apiKey = req.get('X-API-Key');
        if (apiKey !== process.env.ADMIN_API_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const surveys = db.prepare(`
            SELECT
                s.email,
                s.subscribed_at,
                us.planned_use,
                us.anticipated_usage,
                us.how_found,
                us.background,
                us.additional_info,
                us.submitted_at as survey_completed_at
            FROM user_surveys us
            JOIN subscribers s ON us.subscriber_id = s.id
            ORDER BY us.submitted_at DESC
        `).all();

        res.json({
            count: surveys.length,
            responses: surveys
        });
    } catch (error) {
        console.error('Survey responses error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoint: Get all subscribers (admin only)
app.get('/api/subscribers', (req, res) => {
    try {
        const apiKey = req.get('X-API-Key');
        if (apiKey !== process.env.ADMIN_API_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const subscribers = db.prepare(`
            SELECT
                id,
                email,
                subscribed_at,
                confirmed,
                confirmed_at,
                survey_completed
            FROM subscribers
            ORDER BY subscribed_at DESC
        `).all();

        res.json({
            count: subscribers.length,
            subscribers: subscribers
        });
    } catch (error) {
        console.error('Subscribers list error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// API endpoint: Delete subscriber (admin only)
app.delete('/api/subscribers/:id', (req, res) => {
    try {
        const apiKey = req.get('X-API-Key');
        if (apiKey !== process.env.ADMIN_API_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const subscriberId = parseInt(req.params.id);

        // Delete associated survey responses first (foreign key cascade should handle this, but being explicit)
        db.prepare('DELETE FROM user_surveys WHERE subscriber_id = ?').run(subscriberId);

        // Delete the subscriber
        const result = db.prepare('DELETE FROM subscribers WHERE id = ?').run(subscriberId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Subscriber not found' });
        }

        res.json({
            success: true,
            message: 'Subscriber deleted successfully'
        });
    } catch (error) {
        console.error('Delete subscriber error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Blog announcement email template
function getBlogAnnouncementEmailHTML(email, unsubscribeToken) {
    const unsubscribeUrl = `${process.env.BASE_URL || 'https://facilitair.ai'}/api/unsubscribe/${unsubscribeToken}`;
    const blogUrl = 'https://facilitair.ai/blog';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>First Blog Post: Building in Public</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #100F0D; color: #FAFAFA;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #100F0D; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #1A1916; border: 1px solid rgba(92, 225, 230, 0.2); border-radius: 12px; overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, rgba(92, 225, 230, 0.1) 0%, rgba(92, 225, 230, 0.05) 100%); padding: 40px 30px; text-align: center; border-bottom: 1px solid rgba(92, 225, 230, 0.2);">
                            <h1 style="margin: 0; color: #5CE1E6; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">FACILITAIR Blog</h1>
                            <p style="margin: 10px 0 0 0; color: rgba(250, 250, 250, 0.7); font-size: 14px;">Weekly Updates & AI Research</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: rgba(250, 250, 250, 0.9); font-size: 16px; line-height: 1.6;">
                                Hello Facilitair waitlist!
                            </p>
                            <p style="margin: 0 0 20px 0; color: rgba(250, 250, 250, 0.8); font-size: 16px; line-height: 1.6;">
                                First, thanks again for signing up to try Facilitair's beta once it's ready. I'm getting great feedback on the repos and projects so far, so please keep it coming. ETA is still TBD, but I did go ahead and post the first of what will be regular weekly updates on the status of the beta as well as other adjacent projects.
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0; background: rgba(92, 225, 230, 0.05); border: 1px solid rgba(92, 225, 230, 0.2); border-radius: 8px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h2 style="margin: 0 0 10px 0; color: #5CE1E6; font-size: 20px; font-weight: 600;">
                                            Building in Public: A Week of AI Research Across 7 Projects
                                        </h2>
                                        <p style="margin: 0 0 15px 0; color: rgba(250, 250, 250, 0.7); font-size: 14px; font-style: italic;">
                                            October 27, 2025 • Research & Development
                                        </p>
                                        <p style="margin: 0; color: rgba(250, 250, 250, 0.8); font-size: 15px; line-height: 1.6;">
                                            This week we completed Facilitair's training orchestration database, launched arrwDB v2.0 with real-time streaming, validated multi-agent anomaly detection across 5 domains, and have a 35-epoch dendritic compression test running on Whisper-Small (38% parameter reduction). All built collaboratively with Claude Code, GPT-5 Pro, and Grok 4.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 30px 0;">
                                        <a href="${blogUrl}" style="display: inline-block; background: linear-gradient(135deg, #5CE1E6 0%, #4BA9AE 100%); color: #100F0D; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(92, 225, 230, 0.3);">
                                            Read the Blog Post
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 20px 0; color: rgba(250, 250, 250, 0.8); font-size: 15px; line-height: 1.6;">
                                Sharing the link to the website or any of my repos with AI power users in your life who may be interested in multi-model collaboration goes a long way with support as well.
                            </p>
                            <p style="margin: 0; color: rgba(250, 250, 250, 0.8); font-size: 15px; line-height: 1.6;">
                                If you have any questions, feedback, concerns, or just want to say hi, feel free to reach out at <a href="mailto:blake@facilitair.ai" style="color: #5CE1E6; text-decoration: none;">blake@facilitair.ai</a>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px; background-color: rgba(0, 0, 0, 0.3); border-top: 1px solid rgba(92, 225, 230, 0.1); text-align: center;">
                            <p style="margin: 0 0 10px 0; color: rgba(250, 250, 250, 0.5); font-size: 12px;">
                                Sent to ${email}
                            </p>
                            <p style="margin: 0; color: rgba(250, 250, 250, 0.5); font-size: 12px;">
                                <a href="${unsubscribeUrl}" style="color: rgba(92, 225, 230, 0.7); text-decoration: underline;">Unsubscribe</a> •
                                <a href="https://facilitair.ai" style="color: rgba(92, 225, 230, 0.7); text-decoration: none;">facilitair.ai</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

// API endpoint: Send blog announcement to specific emails (admin only)
app.post('/api/send-blog-announcement-to-emails', async (req, res) => {
    try {
        const apiKey = req.get('X-API-Key');
        if (apiKey !== process.env.ADMIN_API_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!resend) {
            return res.status(503).json({ error: 'Email service not configured' });
        }

        const { emails } = req.body;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ error: 'Must provide array of email addresses' });
        }

        // Get subscriber data for these specific emails
        const placeholders = emails.map(() => '?').join(',');
        const subscribers = db.prepare(`
            SELECT email, unsubscribe_token
            FROM subscribers
            WHERE email IN (${placeholders})
            AND confirmed = 1
        `).all(...emails);

        if (subscribers.length === 0) {
            return res.json({
                success: true,
                sent: 0,
                failed: 0,
                message: 'No matching confirmed subscribers found'
            });
        }

        let successCount = 0;
        let failCount = 0;
        const errors = [];

        for (const subscriber of subscribers) {
            try {
                const { data, error } = await resend.emails.send({
                    from: 'Blake @ FACILITAIR <blake@facilitair.ai>',
                    to: subscriber.email,
                    subject: 'First Blog Post: Building in Public - Weekly AI Research Updates',
                    html: getBlogAnnouncementEmailHTML(subscriber.email, subscriber.unsubscribe_token)
                });

                if (error) {
                    failCount++;
                    errors.push({ email: subscriber.email, error: error.message });
                } else {
                    successCount++;
                }

                // Rate limit: wait 500ms between emails (Resend limit: 2 requests/second)
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                failCount++;
                errors.push({ email: subscriber.email, error: error.message });
            }
        }

        res.json({
            success: true,
            sent: successCount,
            failed: failCount,
            total: subscribers.length,
            requested: emails.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Blog announcement error:', error);
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

// API endpoint: Send blog announcement to all confirmed subscribers (admin only)
app.post('/api/send-blog-announcement', async (req, res) => {
    try {
        const apiKey = req.get('X-API-Key');
        if (apiKey !== process.env.ADMIN_API_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!resend) {
            return res.status(503).json({ error: 'Email service not configured' });
        }

        // Get all confirmed subscribers
        const subscribers = db.prepare(`
            SELECT email, unsubscribe_token
            FROM subscribers
            WHERE confirmed = 1
        `).all();

        if (subscribers.length === 0) {
            return res.json({
                success: true,
                sent: 0,
                failed: 0,
                message: 'No confirmed subscribers to email'
            });
        }

        let successCount = 0;
        let failCount = 0;
        const errors = [];

        for (const subscriber of subscribers) {
            try {
                const { data, error } = await resend.emails.send({
                    from: 'Blake @ FACILITAIR <blake@facilitair.ai>',
                    to: subscriber.email,
                    subject: 'First Blog Post: Building in Public - Weekly AI Research Updates',
                    html: getBlogAnnouncementEmailHTML(subscriber.email, subscriber.unsubscribe_token)
                });

                if (error) {
                    failCount++;
                    errors.push({ email: subscriber.email, error: error.message });
                } else {
                    successCount++;
                }

                // Rate limit: wait 500ms between emails (Resend limit: 2 requests/second)
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                failCount++;
                errors.push({ email: subscriber.email, error: error.message });
            }
        }

        res.json({
            success: true,
            sent: successCount,
            failed: failCount,
            total: subscribers.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Blog announcement error:', error);
        res.status(500).json({ error: 'Server error', message: error.message });
    }
});

// API endpoint: Get Cloudflare Analytics (admin only)
app.get('/api/cloudflare-analytics', async (req, res) => {
    try {
        const apiKey = req.get('X-API-Key');
        if (apiKey !== process.env.ADMIN_API_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { period = 'day' } = req.query; // day, week, or month

        // Check if Cloudflare credentials are configured
        if (!process.env.CLOUDFLARE_API_KEY || !process.env.CLOUDFLARE_EMAIL || !process.env.CLOUDFLARE_ZONE_ID) {
            return res.status(503).json({
                error: 'Cloudflare Analytics not configured',
                message: 'Please set CLOUDFLARE_API_KEY, CLOUDFLARE_EMAIL, and CLOUDFLARE_ZONE_ID environment variables'
            });
        }

        // Calculate date range based on period
        const now = new Date();
        let startDate;
        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default: // day
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }

        const datetime_geq = startDate.toISOString();
        const datetime_lt = now.toISOString();

        // GraphQL query for Cloudflare Analytics
        const query = `
            query GetZoneAnalytics($zoneTag: String!, $datetime_geq: DateTime!, $datetime_lt: DateTime!) {
                viewer {
                    zones(filter: { zoneTag: $zoneTag }) {
                        totals: httpRequests1dGroups(filter: { datetime_geq: $datetime_geq, datetime_lt: $datetime_lt }) {
                            uniq {
                                uniques
                            }
                            sum {
                                requests
                                pageViews
                            }
                        }
                        timeSeries: httpRequests1dGroups(
                            filter: { datetime_geq: $datetime_geq, datetime_lt: $datetime_lt }
                            limit: 100
                        ) {
                            dimensions {
                                date
                            }
                            uniq {
                                uniques
                            }
                            sum {
                                requests
                                pageViews
                            }
                        }
                        countryData: httpRequests1dGroups(
                            filter: { datetime_geq: $datetime_geq, datetime_lt: $datetime_lt }
                            limit: 100
                        ) {
                            dimensions {
                                clientCountryName
                            }
                            uniq {
                                uniques
                            }
                            sum {
                                requests
                            }
                        }
                    }
                }
            }
        `;

        const variables = {
            zoneTag: process.env.CLOUDFLARE_ZONE_ID,
            datetime_geq,
            datetime_lt
        };

        // Make request to Cloudflare GraphQL API
        const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Email': process.env.CLOUDFLARE_EMAIL,
                'X-Auth-Key': process.env.CLOUDFLARE_API_KEY
            },
            body: JSON.stringify({ query, variables })
        });

        if (!response.ok) {
            throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.errors) {
            console.error('Cloudflare GraphQL errors:', data.errors);
            return res.status(500).json({
                error: 'Cloudflare API error',
                details: data.errors
            });
        }

        // Extract and format the data
        const zoneData = data.data?.viewer?.zones?.[0];
        if (!zoneData) {
            return res.status(404).json({ error: 'No data found for zone' });
        }

        // Format totals
        const totals = {
            uniqueVisitors: zoneData.totals[0]?.uniq?.uniques || 0,
            totalRequests: zoneData.totals[0]?.sum?.requests || 0,
            pageViews: zoneData.totals[0]?.sum?.pageViews || 0
        };

        // Format time series data
        const timeSeries = (zoneData.timeSeries || []).map(item => ({
            date: item.dimensions?.date,
            uniqueVisitors: item.uniq?.uniques || 0,
            requests: item.sum?.requests || 0,
            pageViews: item.sum?.pageViews || 0
        }));

        // Format country data and aggregate by country
        const countryMap = new Map();
        (zoneData.countryData || []).forEach(item => {
            const country = item.dimensions?.clientCountryName || 'Unknown';
            const existing = countryMap.get(country) || { uniqueVisitors: 0, requests: 0 };
            existing.uniqueVisitors += item.uniq?.uniques || 0;
            existing.requests += item.sum?.requests || 0;
            countryMap.set(country, existing);
        });

        const countryData = Array.from(countryMap.entries())
            .map(([country, stats]) => ({
                country,
                uniqueVisitors: stats.uniqueVisitors,
                requests: stats.requests
            }))
            .sort((a, b) => b.requests - a.requests)
            .slice(0, 20); // Top 20 countries

        res.json({
            period,
            dateRange: {
                start: datetime_geq,
                end: datetime_lt
            },
            totals,
            timeSeries,
            countryData
        });
    } catch (error) {
        console.error('Cloudflare Analytics error:', error);
        res.status(500).json({
            error: 'Failed to fetch Cloudflare Analytics',
            message: error.message
        });
    }
});

// ==================== BETA PASSWORD MANAGEMENT ====================

// Initialize beta passwords table
db.exec(`
    CREATE TABLE IF NOT EXISTS beta_passwords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        password TEXT UNIQUE NOT NULL,
        password_hash TEXT UNIQUE NOT NULL,
        label TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME,
        revoked BOOLEAN DEFAULT 0,
        revoked_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS beta_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_token TEXT UNIQUE NOT NULL,
        password_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (password_id) REFERENCES beta_passwords(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_beta_password_hash ON beta_passwords(password_hash);
    CREATE INDEX IF NOT EXISTS idx_beta_session_token ON beta_sessions(session_token);
    CREATE INDEX IF NOT EXISTS idx_beta_session_expires ON beta_sessions(expires_at);
`);

// Admin password from environment variable (YOU MUST SET THIS)
const ADMIN_PASSWORD = process.env.BETA_ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex');
if (!process.env.BETA_ADMIN_PASSWORD) {
    console.warn(`
        ⚠️  WARNING: BETA_ADMIN_PASSWORD not set in environment!
        ⚠️  Using generated password: ${ADMIN_PASSWORD}
        ⚠️  Set BETA_ADMIN_PASSWORD in .env for production
    `);
}

// Helper: Generate random password
function generateBetaPassword() {
    // Generate 4 groups of 4 characters (e.g., A7F2-K9M3-P5T8-W2D6)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
    const groups = [];
    for (let i = 0; i < 4; i++) {
        let group = '';
        for (let j = 0; j < 4; j++) {
            group += chars[Math.floor(Math.random() * chars.length)];
        }
        groups.push(group);
    }
    return groups.join('-');
}

// Helper: Hash password
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper: Generate session token
function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Helper: Verify admin token
function verifyAdminToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const adminTokenHash = hashPassword(ADMIN_PASSWORD);

    if (hashPassword(token) !== adminTokenHash) {
        return res.status(401).json({ success: false, error: 'Invalid admin token' });
    }

    next();
}

// API: Admin authentication
app.post('/api/beta/admin/auth', (req, res) => {
    try {
        const { password } = req.body;

        if (password === ADMIN_PASSWORD) {
            res.json({
                success: true,
                token: ADMIN_PASSWORD // In production, use JWT
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Invalid admin password'
            });
        }
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// API: Generate new beta password (admin only)
app.post('/api/beta/admin/generate', verifyAdminToken, (req, res) => {
    try {
        const { label } = req.body;

        if (!label || label.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Label is required'
            });
        }

        const password = generateBetaPassword();
        const passwordHash = hashPassword(password);

        const stmt = db.prepare(`
            INSERT INTO beta_passwords (password, password_hash, label)
            VALUES (?, ?, ?)
        `);

        stmt.run(password, passwordHash, label.trim());

        res.json({
            success: true,
            password: password,
            label: label.trim()
        });
    } catch (error) {
        console.error('Generate password error:', error);
        if (error.message.includes('UNIQUE')) {
            // Retry once if collision
            return app.post('/api/beta/admin/generate', verifyAdminToken)(req, res);
        }
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// API: List all beta passwords (admin only)
app.get('/api/beta/admin/list', verifyAdminToken, (req, res) => {
    try {
        const passwords = db.prepare(`
            SELECT id, password, label, created_at, last_used_at, revoked, revoked_at
            FROM beta_passwords
            ORDER BY created_at DESC
        `).all();

        res.json({
            success: true,
            passwords: passwords
        });
    } catch (error) {
        console.error('List passwords error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// API: Revoke beta password (admin only)
app.post('/api/beta/admin/revoke', verifyAdminToken, (req, res) => {
    try {
        const { password } = req.body;

        const stmt = db.prepare(`
            UPDATE beta_passwords
            SET revoked = 1, revoked_at = CURRENT_TIMESTAMP
            WHERE password = ?
        `);

        const result = stmt.run(password);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Password not found'
            });
        }

        // Invalidate all sessions for this password
        db.prepare(`
            DELETE FROM beta_sessions
            WHERE password_id = (SELECT id FROM beta_passwords WHERE password = ?)
        `).run(password);

        res.json({
            success: true,
            message: 'Password revoked'
        });
    } catch (error) {
        console.error('Revoke password error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// API: Verify beta password (public)
app.post('/api/beta/verify', (req, res) => {
    try {
        const { password } = req.body;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || '';

        if (!password) {
            return res.status(400).json({
                success: false,
                error: 'Password required'
            });
        }

        // Check if password exists and is not revoked
        const betaPassword = db.prepare(`
            SELECT id, password, revoked
            FROM beta_passwords
            WHERE password = ? AND revoked = 0
        `).get(password);

        if (!betaPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or revoked password'
            });
        }

        // Update last_used_at
        db.prepare(`
            UPDATE beta_passwords
            SET last_used_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(betaPassword.id);

        // Create session token (expires in 7 days)
        const sessionToken = generateSessionToken();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        db.prepare(`
            INSERT INTO beta_sessions (session_token, password_id, expires_at, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?)
        `).run(sessionToken, betaPassword.id, expiresAt.toISOString(), ip, userAgent);

        res.json({
            success: true,
            session_token: sessionToken,
            expires_at: expiresAt.toISOString()
        });
    } catch (error) {
        console.error('Verify password error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// API: Verify session token (public)
app.post('/api/beta/verify-session', (req, res) => {
    try {
        const { session_token } = req.body;

        if (!session_token) {
            return res.status(400).json({
                success: false,
                valid: false,
                error: 'Session token required'
            });
        }

        // Check if session exists and hasn't expired
        const session = db.prepare(`
            SELECT s.id, s.expires_at, p.revoked
            FROM beta_sessions s
            JOIN beta_passwords p ON s.password_id = p.id
            WHERE s.session_token = ?
        `).get(session_token);

        if (!session) {
            return res.json({
                success: true,
                valid: false,
                error: 'Invalid session'
            });
        }

        const now = new Date();
        const expiresAt = new Date(session.expires_at);

        if (now > expiresAt || session.revoked) {
            // Delete expired or revoked session
            db.prepare('DELETE FROM beta_sessions WHERE id = ?').run(session.id);

            return res.json({
                success: true,
                valid: false,
                error: 'Session expired or revoked'
            });
        }

        res.json({
            success: true,
            valid: true
        });
    } catch (error) {
        console.error('Verify session error:', error);
        res.status(500).json({ success: false, valid: false, error: 'Server error' });
    }
});

// Cleanup expired sessions (run periodically)
setInterval(() => {
    try {
        const result = db.prepare(`
            DELETE FROM beta_sessions
            WHERE expires_at < datetime('now')
        `).run();

        if (result.changes > 0) {
            console.log(`Cleaned up ${result.changes} expired beta sessions`);
        }
    } catch (error) {
        console.error('Session cleanup error:', error);
    }
}, 60 * 60 * 1000); // Run every hour

// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== CORCH EXECUTION API PROXY ====================

// Proxy endpoint for Corch execution with SSE streaming
app.post('/api/corch/execute', async (req, res) => {
    try {
        const { task } = req.body;

        if (!task || task.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Task description is required'
            });
        }

        const CORCH_API_URL = process.env.CORCH_API_URL || 'http://localhost:5001';

        // Forward request to Corch backend and stream response
        const response = await fetch(`${CORCH_API_URL}/api/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ task })
        });

        if (!response.ok) {
            throw new Error(`Corch API returned ${response.status}`);
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        // Pipe the SSE stream from Corch to the client
        response.body.pipe(res);

    } catch (error) {
        console.error('Corch execution proxy error:', error);
        res.status(500).json({
            success: false,
            error: `Execution service unavailable: ${error.message}`
        });
    }
});

// ==================== V10 ROUTING API PROXY ====================

// Mock V10 routing endpoint (simple heuristic-based routing for demo)
app.post('/api/v10/route', (req, res) => {
    try {
        const { task } = req.body;

        if (!task || task.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Task description is required'
            });
        }

        // Simple heuristic routing for demo
        const taskLower = task.toLowerCase();
        let strategy = 'DIRECT';
        let capability = 'code_generation';
        let domain = 'backend';
        let execution_type = 'pure_sequential';

        if (taskLower.includes('deploy') || taskLower.includes('ci/cd') || taskLower.includes('pipeline')) {
            capability = 'deployment';
            domain = 'infrastructure';
            strategy = 'ORCHESTRATE';
        } else if (taskLower.includes('test') || taskLower.includes('testing')) {
            capability = 'unit_testing';
            domain = 'testing';
        } else if (taskLower.includes('frontend') || taskLower.includes('react') || taskLower.includes('ui') || taskLower.includes('component')) {
            capability = 'code_generation';
            domain = 'frontend';
        } else if (taskLower.includes('api') || taskLower.includes('endpoint') || taskLower.includes('rest')) {
            capability = 'code_generation';
            domain = 'backend';
        } else if (taskLower.includes('data') || taskLower.includes('processing') || taskLower.includes('analytics')) {
            capability = 'data_processing';
            domain = 'backend';
        } else if (taskLower.includes('refactor') || taskLower.includes('optimize')) {
            capability = 'refactoring';
            domain = 'backend';
        } else if (taskLower.includes('document') || taskLower.includes('readme')) {
            capability = 'documentation';
            domain = 'general';
        }

        if (task.split(' ').length > 15 || taskLower.includes('comprehensive') || taskLower.includes('complete')) {
            strategy = 'ORCHESTRATE';
        }

        if (taskLower.includes('parallel')) {
            execution_type = 'pure_parallel';
        } else if (taskLower.includes('if') || taskLower.includes('conditional') || taskLower.includes('based on')) {
            execution_type = 'conditional';
        } else if (taskLower.includes('loop') || taskLower.includes('iterate')) {
            execution_type = 'iterative';
        }

        res.json({
            success: true,
            strategy,
            capability,
            domain,
            execution_type,
            confidence: {
                strategy: 0.75 + Math.random() * 0.2,
                capability: 0.65 + Math.random() * 0.25,
                domain: 0.70 + Math.random() * 0.25,
                execution_type: 0.55 + Math.random() * 0.30
            }
        });
    } catch (error) {
        console.error('V10 routing error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Serve HTML pages
app.get('/', (req, res) => {
    // Check if accessing via beta subdomain
    const hostname = req.hostname || req.get('host') || req.headers.host || req.headers['x-forwarded-host'];

    // Log for debugging
    console.log('Root request - hostname:', hostname, 'headers:', {
        host: req.get('host'),
        'x-forwarded-host': req.headers['x-forwarded-host'],
        'x-forwarded-proto': req.headers['x-forwarded-proto']
    });

    if (hostname && hostname.startsWith('beta.')) {
        console.log('Serving beta.html for hostname:', hostname);
        res.sendFile(path.join(__dirname, 'beta.html'));
    } else {
        console.log('Serving index.html for hostname:', hostname);
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

app.get('/about.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/blog.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'blog.html'));
});

app.get('/survey.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'survey.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`FACILITAIR Landing Page server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Server listening on 0.0.0.0:${PORT}`);
    console.log(`Health check available at /health`);
});

// Log when server is actually ready
server.on('listening', () => {
    const addr = server.address();
    console.log(`Server bound to ${addr.address}:${addr.port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close();
    console.log('Database connection closed');
    process.exit(0);
});
