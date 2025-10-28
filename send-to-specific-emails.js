// Send blog announcement to specific failed subscribers via Railway API
require('dotenv').config();

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const RAILWAY_URL = 'https://facilitair.ai'; // Production Railway URL

const failedEmails = [
    'ecohen16@gmail.com',
    'ben.hou+facilitair@gong.io',
    'poosasaikiran0466@gmail.com',
    'ai@lahoda.net'
];

async function sendToSpecificEmails() {
    console.log('Sending to 4 failed subscribers via Railway API...\n');
    console.log('Target emails:', failedEmails.join(', '));
    console.log('');

    // We'll need to create a new endpoint that accepts specific emails
    // For now, let's use the Resend API directly
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // We need to make a request to Railway to get the unsubscribe tokens for these emails
    console.log('Fetching subscriber data from Railway...\n');

    let subscribers = [];
    for (const email of failedEmails) {
        // We'll fetch all subscribers and filter
        try {
            const response = await fetch(`${RAILWAY_URL}/api/subscribers`, {
                headers: {
                    'X-API-Key': ADMIN_API_KEY
                }
            });

            if (!response.ok) {
                console.error('Failed to fetch subscribers from Railway');
                continue;
            }

            const data = await response.json();
            const subscriber = data.subscribers.find(s => s.email === email);

            if (subscriber) {
                subscribers.push({
                    email: subscriber.email,
                    unsubscribe_token: subscriber.unsubscribe_token
                });
            }
        } catch (error) {
            console.error(`Error fetching data for ${email}:`, error.message);
        }
    }

    console.log(`Found ${subscribers.length} subscribers with unsubscribe tokens\n`);

    // Blog announcement email template
    function getBlogAnnouncementEmailHTML(email, unsubscribeToken) {
        const unsubscribeUrl = `${RAILWAY_URL}/api/unsubscribe/${unsubscribeToken}`;
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

    let successCount = 0;
    let failCount = 0;

    for (const subscriber of subscribers) {
        try {
            console.log(`Sending to: ${subscriber.email}`);

            const { data, error } = await resend.emails.send({
                from: 'Blake @ FACILITAIR <blake@facilitair.ai>',
                to: subscriber.email,
                subject: 'First Blog Post: Building in Public - Weekly AI Research Updates',
                html: getBlogAnnouncementEmailHTML(subscriber.email, subscriber.unsubscribe_token)
            });

            if (error) {
                console.error(`  ❌ Failed: ${error.message}`);
                failCount++;
            } else {
                console.log(`  ✅ Sent successfully (ID: ${data.id})`);
                successCount++;
            }

            // Rate limit: wait 500ms between emails (Resend limit: 2/sec)
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
            failCount++;
        }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total: ${subscribers.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
}

sendToSpecificEmails().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
