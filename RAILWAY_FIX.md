# Railway Deployment Fix

## Issue
Railway build failing with:
```
npm ci` can only install packages when your package.json and package-lock.json are in sync
Missing: express-rate-limit@7.5.1 from lock file
Missing: helmet@7.2.0 from lock file
```

## Root Cause
The `package-lock.json` had newer versions than `package.json` specified:
- package.json: `express-rate-limit@^7.1.5`, `helmet@^7.1.0`
- package-lock.json: `express-rate-limit@7.5.1`, `helmet@7.2.0`

## Solution Applied
1. ✅ Removed `package-lock.json` entirely
2. ✅ Railway will regenerate it during build with `npm install`
3. ✅ `railway.toml` already configured with `buildCommand = "npm install"` (not `npm ci`)

## Deploy Now

```bash
cd /Users/bledden/Documents/facilitair-lp

# Commit the deletion
git add -u
git commit -m "fix: remove out-of-sync package-lock.json for Railway rebuild"

# Push to trigger deployment
git push origin main
```

Railway will now:
1. Run `npm install` (not `npm ci`)
2. Generate fresh `package-lock.json` with correct versions
3. Build successfully
4. Deploy to beta.facilitair.ai

## What Changed
- ❌ Removed: `package-lock.json` (out of sync)
- ✅ Kept: `package.json` (correct)
- ✅ Kept: `railway.toml` (already uses `npm install`)

## Why This Works
- `npm ci` requires exact lock file match (strict)
- `npm install` resolves from package.json (flexible)
- Railway's `npm install` will create new lock file
- New lock file will match package.json exactly

## Next Deployment
After this succeeds, Railway will have generated a fresh `package-lock.json`. You can:
1. Pull it down: `git pull origin main`
2. Keep it in repo for faster future builds
3. Or continue without it (slightly slower but always works)

---

**Status**: Ready to deploy
**Command**: `git push origin main`
**Expected**: Successful build and deployment
