# Survey Link Fix Instructions

## Problem

Survey links in confirmation emails are broken because the `BASE_URL` environment variable is not set in the Railway deployment, causing links to point to `http://localhost:3000` instead of `https://facilitair.ai`.

## Solution

### 1. Add BASE_URL to Railway Environment Variables

1. Go to [Railway Dashboard](https://railway.app)
2. Select the **facilitair-lp** project
3. Click on **Variables** tab
4. Add the following variable:
   ```
   BASE_URL=https://facilitair.ai
   ```
5. Railway will automatically redeploy

### 2. Verify the Fix

After deployment, the survey links in emails should look like:
```
https://facilitair.ai/survey.html?token=<unique-token>
```

Instead of:
```
http://localhost:3000/survey.html?token=<unique-token>
```

### 3. Test the Fix

Run the test script to send a survey email to blake@facilitair.ai:

```bash
cd /Users/bledden/Documents/facilitair-lp
BASE_URL="https://facilitair.ai" node test-survey-email.js
```

Check the email and click the survey link to verify it works.

## Survey Questions Overview

The survey currently asks 5 questions:

1. **How do you plan to use FACILITAIR?** (Required)
   - Open text field for use cases

2. **Anticipated Usage** (Required)
   - Daily, Weekly, Monthly, or Project-based

3. **How did you find out about FACILITAIR?** (Required)
   - Social Media, Search, Recommendation, Blog, Conference, GitHub, Other

4. **Your Background** (Optional)
   - Open text for professional background

5. **Anything Else?** (Optional)
   - Open text for additional feedback

## Follow-Up Email Template

Once the fix is deployed, send a follow-up email to all confirmed beta subscribers who haven't completed the survey yet.

See `SURVEY_FOLLOWUP_EMAIL.md` for the email template.
