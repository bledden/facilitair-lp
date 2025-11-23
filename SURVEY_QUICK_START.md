# Enhanced Survey - Quick Start Guide

## ✅ What's Done

Survey upgraded from 5 → 11 questions. All code pushed to GitHub, Railway is deploying.

## 🚨 Action Required

Run this migration on Railway (one-time):

```bash
node migrate-survey-schema.js
```

This adds 7 new columns to `user_surveys` table.

## 📋 New Questions Added

1. **Task Types** - Maps to V13's 8 capabilities (code_generation, debugging, etc.)
2. **Domains** - Maps to V13's 19 domains (frontend, backend, ML, etc.)
3. **Role** - User segmentation (engineer, PM, founder, etc.)
4. **Current AI Services** - Identifies BYOK demand (OpenAI, OpenRouter, etc.)
5. **Pain Points** - Competitive positioning data
6. **Value Props** - Feature prioritization (what matters most?)
7. **BYOK Preference** - Pricing strategy input (already built, just needs demand validation)

## 🎯 Why These Questions Matter

| Question | Answers This Business Question |
|----------|-------------------------------|
| Task Types | Which of our 8 capabilities need improvement? |
| Domains | Which of our 19 domains should we optimize routing for? |
| Current Services | Should we expose BYOK feature in UI? |
| Pain Points | What problem do we solve that competitors don't? |
| Value Props | Which features to highlight in onboarding? |
| BYOK | Should we offer BYOK tier with no markup? |
| Role | How to segment users for messaging? |

## 📊 Survey Stats

- **Total Questions:** 11 (was 5)
- **Required:** 3 (same as before)
- **Optional:** 8 (more data, but not forced)
- **Time to Complete:** 4-7 minutes
- **Multi-select:** 4 questions (faster than typing)
- **Textarea:** 3 questions (same as before)

## 🔍 Sample Insights You'll Get

### Capability Demand
```
Code Generation: 78%
Debugging: 45%
Testing: 23%
→ Action: Improve testing capability routing
```

### BYOK Interest
```
Yes (OpenRouter): 35%
Yes (OpenAI): 22%
No preference: 43%
→ Action: Build BYOK UI for 57% who want it
```

### Value Prop Resonance
```
Cost optimization: 67%
Auto model selection: 54%
Multi-step orchestration: 43%
→ Action: Lead with "Save 60% on AI costs" in marketing
```

## 🧪 Testing

Send yourself a test email:
```bash
cd /Users/bledden/Documents/facilitair-lp
BASE_URL="https://facilitair.ai" node test-survey-email.js
```

## 📁 Files Changed

- `survey.html` - Added 7 questions with checkboxes
- `server.js` - Updated API to handle arrays
- `migrate-survey-schema.js` - Database migration (NEW)

## 🚀 Deploy Checklist

- [x] Code pushed to GitHub
- [x] Railway auto-deploy triggered
- [ ] Run migration: `node migrate-survey-schema.js`
- [ ] Test survey with your email
- [ ] Verify data saves correctly

## 💡 Pro Tips

1. **No Repetition:** Every question unique, no overlap
2. **All Optional:** Only 3 required (same as before)
3. **Grounded in Reality:** Every question maps to existing code or business decision
4. **Future-Proof:** Data structure supports analysis and segmentation

## 📧 Survey Link Format

```
https://facilitair.ai/survey.html?token=<subscriber-token>
```

Survey link is automatically sent after email confirmation.

---

**Questions?** See `ENHANCED_SURVEY_SUMMARY.md` for full details.
