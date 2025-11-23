/**
 * Send apology email about survey link bug
 */

require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Survey Link Fixed - FACILITAIR</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #100F0D; color: #FAFAFA;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #100F0D; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #1A1916; border: 1px solid rgba(92, 225, 230, 0.2); border-radius: 12px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, rgba(92, 225, 230, 0.1) 0%, rgba(92, 225, 230, 0.05) 100%); padding: 40px 30px; text-align: center; border-bottom: 1px solid rgba(92, 225, 230, 0.2);">
                            <h1 style="margin: 0; color: #5CE1E6; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Our Apologies</h1>
                            <p style="margin: 10px 0 0 0; color: rgba(250, 250, 250, 0.7); font-size: 14px;">We fixed a bug with the survey link</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: rgba(250, 250, 250, 0.8); font-size: 16px; line-height: 1.6;">
                                Hi there,
                            </p>

                            <p style="margin: 0 0 20px 0; color: rgba(250, 250, 250, 0.8); font-size: 16px; line-height: 1.6;">
                                I'm reaching out to apologize if you already received this, but we discovered a bug that may have prevented some survey links from working properly for a brief period.
                            </p>

                            <p style="margin: 0 0 20px 0; color: rgba(250, 250, 250, 0.8); font-size: 16px; line-height: 1.6;">
                                <strong style="color: #5CE1E6;">The issue has been fixed</strong>, and your survey link is now fully functional. If you tried to access it before and encountered an error, we apologize for the inconvenience.
                            </p>

                            <p style="margin: 0 0 30px 0; color: rgba(250, 250, 250, 0.8); font-size: 16px; line-height: 1.6;">
                                Your input is incredibly valuable as we build FACILITAIR, and we'd still love to hear from you. The survey takes just 2-3 minutes and helps us prioritize features for the beta launch.
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <a href="https://facilitair.ai/survey.html?token={{TOKEN}}" style="display: inline-block; background: linear-gradient(135deg, #5CE1E6 0%, #2DD4BF 100%); color: #100F0D; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-weight: 700; font-size: 18px; text-align: center;">Complete Survey</a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 20px 0; color: rgba(250, 250, 250, 0.8); font-size: 16px; line-height: 1.6;">
                                Thank you for your patience and for being part of the FACILITAIR beta community!
                            </p>

                            <p style="margin: 20px 0 0 0; color: rgba(250, 250, 250, 0.8); font-size: 16px; line-height: 1.6;">
                                Best,<br>
                                <strong style="color: #5CE1E6;">The FACILITAIR Team</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: rgba(92, 225, 230, 0.05); padding: 30px; border-top: 1px solid rgba(92, 225, 230, 0.2); text-align: center;">
                            <p style="margin: 0 0 10px 0; color: rgba(250, 250, 250, 0.7); font-size: 14px;">
                                <a href="mailto:blake@facilitair.ai" style="color: #5CE1E6; text-decoration: none;">Questions? Email blake@facilitair.ai</a>
                            </p>
                            <p style="margin: 10px 0 0 0; color: rgba(250, 250, 250, 0.5); font-size: 12px;">
                                © 2025 FACILITAIR. All rights reserved.
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

async function sendApologyEmail() {
    const email = 'blake@facilitair.ai';

    // Get subscriber token
    const Database = require('better-sqlite3');
    const db = new Database('facilitair-emails.db');

    let subscriber = db.prepare('SELECT * FROM subscribers WHERE email = ?').get(email);

    if (!subscriber) {
        console.log('❌ Subscriber not found. Creating test entry...');
        const crypto = require('crypto');
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');
        const insertStmt = db.prepare(`
            INSERT INTO subscribers (email, confirmed, unsubscribe_token)
            VALUES (?, 1, ?)
        `);
        insertStmt.run(email, unsubscribeToken);
        subscriber = db.prepare('SELECT * FROM subscribers WHERE email = ?').get(email);
    }

    db.close();

    const surveyUrl = `https://facilitair.ai/survey.html?token=${subscriber.unsubscribe_token}`;
    const html = emailHTML.replace('{{TOKEN}}', subscriber.unsubscribe_token);

    console.log('Sending apology email to blake@facilitair.ai...');
    console.log('Survey URL:', surveyUrl);

    try {
        const { data, error } = await resend.emails.send({
            from: 'FACILITAIR <noreply@facilitair.ai>',
            to: email,
            subject: 'Survey Link Issue Fixed - Our Apologies',
            html: html
        });

        if (error) {
            console.error('✗ Email send error:', error);
            return;
        }

        console.log('✓ Apology email sent successfully!');
        console.log('  Email ID:', data.id);
        console.log('  To:', email);
        console.log('  Survey token:', subscriber.unsubscribe_token);
    } catch (error) {
        console.error('✗ Error:', error);
    }
}

sendApologyEmail().then(() => {
    console.log('\nDone!');
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
