/**
 * Test script to send a survey email to blake@facilitair.ai
 * Usage: BASE_URL=https://facilitair.ai node test-survey-email.js
 */

require('dotenv').config();
const Database = require('better-sqlite3');
const { Resend } = require('resend');
const crypto = require('crypto');

const resend = new Resend(process.env.RESEND_API_KEY);
const db = new Database('facilitair-emails.db');

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
                    <tr>
                        <td style="background: linear-gradient(135deg, rgba(92, 225, 230, 0.1) 0%, rgba(92, 225, 230, 0.05) 100%); padding: 40px 30px; text-align: center; border-bottom: 1px solid rgba(92, 225, 230, 0.2);">
                            <h1 style="margin: 0; color: #5CE1E6; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Welcome to FACILITAIR!</h1>
                            <p style="margin: 10px 0 0 0; color: rgba(250, 250, 250, 0.7); font-size: 14px;">You're officially on the beta waitlist</p>
                        </td>
                    </tr>
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
                                Take 2 minutes to complete our quick survey and help shape the platform:
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="${surveyUrl}" style="display: inline-block; background: linear-gradient(135deg, #5CE1E6 0%, #2DD4BF 100%); color: #100F0D; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; text-align: center;">Complete Survey</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: rgba(92, 225, 230, 0.05); padding: 30px; border-top: 1px solid rgba(92, 225, 230, 0.2); text-align: center;">
                            <p style="margin: 0; color: rgba(250, 250, 250, 0.5); font-size: 12px;">
                                © ${new Date().getFullYear()} FACILITAIR. All rights reserved.
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

async function sendTestSurveyEmail() {
    const email = 'blake@facilitair.ai';

    // Check if email already exists
    let subscriber = db.prepare('SELECT * FROM subscribers WHERE email = ?').get(email);

    if (!subscriber) {
        // Create test subscriber
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');
        const insertStmt = db.prepare(`
            INSERT INTO subscribers (email, confirmed, unsubscribe_token)
            VALUES (?, 1, ?)
        `);
        insertStmt.run(email, unsubscribeToken);
        subscriber = db.prepare('SELECT * FROM subscribers WHERE email = ?').get(email);
        console.log('✓ Created test subscriber:', email);
    }

    console.log('Survey URL:', `${process.env.BASE_URL || 'http://localhost:3000'}/survey.html?token=${subscriber.unsubscribe_token}`);

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'FACILITAIR <team@facilitair.ai>',
            to: email,
            subject: '[TEST] Welcome to FACILITAIR - Share Your Story',
            html: getFollowUpEmailHTML(subscriber.unsubscribe_token, email)
        });

        if (error) {
            console.error('✗ Email send error:', error);
            return;
        }

        console.log('✓ Test survey email sent successfully!');
        console.log('  Email ID:', data.id);
        console.log('  To:', email);
        console.log('  Survey token:', subscriber.unsubscribe_token);
    } catch (error) {
        console.error('✗ Error:', error);
    }
}

// Run the test
sendTestSurveyEmail().then(() => {
    console.log('\nDone!');
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
