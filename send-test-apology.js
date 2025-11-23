/**
 * Send test apology email about survey link bug
 * Simplified version without database dependency
 */

require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Use blake.ledden@gmail.com's PRODUCTION token
const testToken = '669c941cb420d6755690788e8cdb7ec5e89e097874ca85cd5718396d29b835e4';

const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Survey Link Fixed - FACILITAIR</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #100F0D; color: #FAFAFA;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #100F0D; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: rgba(26, 25, 22, 0.95); border: 1px solid rgba(92, 225, 230, 0.15); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
                    <!-- Header with Logo -->
                    <tr>
                        <td style="padding: 50px 40px 30px 40px; text-align: center;">
                            <!-- Facilitair Logo SVG -->
                            <div style="margin-bottom: 30px;">
                                <svg width="50" height="50" viewBox="0 0 100 100" style="display: inline-block;">
                                    <defs>
                                        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style="stop-color:#7EEEF3;stop-opacity:1" />
                                            <stop offset="50%" style="stop-color:#5CE1E6;stop-opacity:1" />
                                            <stop offset="100%" style="stop-color:#2DD4BF;stop-opacity:1" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M50 5 L95 30 L95 70 L50 95 L5 70 L5 30 Z" fill="none" stroke="url(#logoGrad)" stroke-width="3"/>
                                    <circle cx="50" cy="50" r="20" fill="url(#logoGrad)" opacity="0.9"/>
                                    <circle cx="50" cy="50" r="8" fill="#100F0D"/>
                                </svg>
                            </div>
                            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800; letter-spacing: 0.1em; background: linear-gradient(135deg, #7EEEF3 0%, #5CE1E6 50%, #2DD4BF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">FACILITAIR</h1>
                            <p style="margin: 0; color: rgba(250, 250, 250, 0.5); font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase;">Quick Update</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px;">
                            <h2 style="margin: 0 0 25px 0; color: #FAFAFA; font-size: 22px; font-weight: 600; text-align: center;">Survey Link Fixed</h2>

                            <p style="margin: 0 0 20px 0; color: rgba(250, 250, 250, 0.85); font-size: 15px; line-height: 1.7;">
                                Hi there,
                            </p>

                            <p style="margin: 0 0 20px 0; color: rgba(250, 250, 250, 0.85); font-size: 15px; line-height: 1.7;">
                                We discovered a bug that may have prevented some survey links from working properly. <span style="color: #5CE1E6; font-weight: 600;">The issue has been fixed</span>, and your survey link is now fully functional.
                            </p>

                            <p style="margin: 0 0 30px 0; color: rgba(250, 250, 250, 0.85); font-size: 15px; line-height: 1.7;">
                                Your input is incredibly valuable as we build Facilitair. The survey takes just <strong style="color: #5CE1E6;">2 minutes</strong> and helps us prioritize features for the beta launch.
                            </p>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 10px 0 30px 0;">
                                        <a href="https://facilitair.ai/survey.html?token=${testToken}" style="display: inline-block; background: linear-gradient(135deg, #5CE1E6 0%, #2DD4BF 100%); color: #100F0D; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 15px; text-align: center; letter-spacing: 0.02em; box-shadow: 0 4px 20px rgba(92, 225, 230, 0.3);">Complete Survey</a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 25px 0; color: rgba(250, 250, 250, 0.85); font-size: 15px; line-height: 1.7;">
                                Thank you for your patience and for being part of the Facilitair beta community!
                            </p>

                            <p style="margin: 0; color: rgba(250, 250, 250, 0.85); font-size: 15px; line-height: 1.7;">
                                Best,<br>
                                <span style="color: #5CE1E6; font-weight: 600;">The Facilitair Team</span>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: rgba(92, 225, 230, 0.03); padding: 25px 40px; border-top: 1px solid rgba(92, 225, 230, 0.1); text-align: center;">
                            <p style="margin: 0 0 8px 0; color: rgba(250, 250, 250, 0.6); font-size: 13px;">
                                Questions? <a href="mailto:blake@facilitair.ai" style="color: #5CE1E6; text-decoration: none; font-weight: 500;">blake@facilitair.ai</a>
                            </p>
                            <p style="margin: 0; color: rgba(250, 250, 250, 0.4); font-size: 11px;">
                                © 2025 Facilitair. All rights reserved.
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

async function sendTestApologyEmail() {
    const email = 'blake.ledden@gmail.com';
    const surveyUrl = `https://facilitair.ai/survey.html?token=${testToken}`;

    console.log('Sending test apology email to blake.ledden@gmail.com...');
    console.log('Survey URL:', surveyUrl);

    try {
        const { data, error } = await resend.emails.send({
            from: 'FACILITAIR <noreply@facilitair.ai>',
            to: email,
            subject: 'Survey Link Issue Fixed - Our Apologies',
            html: emailHTML
        });

        if (error) {
            console.error('✗ Email send error:', error);
            return;
        }

        console.log('✓ Apology email sent successfully!');
        console.log('  Email ID:', data.id);
        console.log('  To:', email);
        console.log('  Test token:', testToken);
    } catch (error) {
        console.error('✗ Error:', error);
    }
}

sendTestApologyEmail().then(() => {
    console.log('\nDone!');
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
