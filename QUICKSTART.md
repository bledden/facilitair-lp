# FACILITAIR Landing Page - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment (Optional for Development)

```bash
cp .env.example .env
```

Edit `.env` and set your admin API key (only needed for production email stats endpoint).

### 3. Run Development Mode

#### Option A: Frontend Only (Recommended for Design Work)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Note**: Email submissions won't work without the backend server.

#### Option B: Full Stack (Frontend + Backend)

**Terminal 1** - Run backend server:
```bash
npm run dev:server
```

**Terminal 2** - Run frontend dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Email submissions will be saved to `facilitair-emails.db`

## 📦 What You Get

### 4 Pages
- **Landing Page** (`index.html`) - Hero, stats, projects, features, email signup
- **About Page** (`about.html`) - Mission, story, founder info
- **Blog Page** (`blog.html`) - Blog posts and topics
- **Survey Page** (`survey.html`) - User info collection form

### Adaptive Animations
The site automatically detects device performance and chooses the best animation:
- **High Performance**: Liquid blob physics (desktop)
- **Medium Performance**: Network packet animation (mobile/integrated GPU)
- **Low Performance**: Static glassmorphic design (respects `prefers-reduced-motion`)

### Features
- ✅ Glassmorphic design with FACILITAIR colors
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Performance-optimized animations
- ✅ **Double opt-in email confirmation**
- ✅ **Automated welcome + survey emails**
- ✅ **User survey collection** (use cases, frequency, background)
- ✅ Secure email backend with SQLite
- ✅ Rate limiting (5 requests/min per IP)
- ✅ Unsubscribe functionality
- ✅ Logo spinning on capable devices

## 🎨 Design System

### Colors
```css
--facilitair-teal: #5CE1E6    /* Primary accent */
--facilitair-black: #100F0D   /* Background */
--facilitair-white: #FAFAFA   /* Text */
--facilitair-gray: #D9D9D9    /* Borders */
```

### Typography
- **Font**: Montserrat (all weights)
- **Headings**: Bold, teal accents
- **Body**: Regular, white text on dark background

### Spacing
Consistent spacing scale: `0.25rem` to `8rem`

## 🔧 Customization

### Change Logo
Replace `logo.png` with your own (recommended: 512x512px PNG with transparency)

### Update Colors
Edit CSS variables in `styles/main.css`:
```css
:root {
    --facilitair-teal: #YOUR_COLOR;
}
```

### Modify Content
- **Landing**: Edit `index.html`
- **About**: Edit `about.html`
- **Blog**: Edit `blog.html`
- **Styles**: Edit `styles/main.css`

### Force Animation Type
Edit `scripts/performance.js`:
```javascript
// Force specific animation
this.animationType = 'liquid';  // or 'network' or 'none'
```

## 📧 Email Collection System

### Complete Flow

1. **User subscribes** → Receives confirmation email
2. **User clicks confirmation link** → Email confirmed → Receives welcome + survey email
3. **User completes survey** → Data saved to database

### Email Service Setup (Resend)

1. Sign up at [resend.com](https://resend.com) - **Free: 3,000 emails/month**
2. Get API key from [resend.com/api-keys](https://resend.com/api-keys)
3. Add to `.env`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=FACILITAIR <onboarding@facilitair.ai>
BASE_URL=http://localhost:3000
```

**For Development**: Leave `RESEND_API_KEY` blank to log confirmation links to console instead of sending emails.

### Survey Questions

**Required**:
- How do you plan to use FACILITAIR? (textarea)
- Anticipated usage frequency (select: Daily/Weekly/Monthly/Project-based)
- How did you find out about FACILITAIR? (select)

**Optional**:
- Your background (textarea)
- Additional feedback (textarea)

### Database Tables

**subscribers**: email, confirmation status, tokens, timestamps
**user_surveys**: planned use, usage frequency, discovery source, background, feedback

### View Data

```bash
# View all subscribers
sqlite3 facilitair-emails.db "SELECT email, confirmed, survey_completed FROM subscribers;"

# View survey responses
sqlite3 facilitair-emails.db "SELECT s.email, u.planned_use, u.anticipated_usage FROM subscribers s JOIN user_surveys u ON s.id = u.subscriber_id;"

# Get stats via API
curl -H "X-API-Key: your-admin-key" http://localhost:3000/api/stats
```

### API Endpoints

- `POST /api/subscribe` - Subscribe to email list
- `GET /api/confirm/:token` - Confirm email
- `POST /api/survey` - Submit survey
- `GET /api/unsubscribe/:token` - Unsubscribe
- `GET /api/stats` - Get stats (requires API key)

## 🚢 Deployment

### Deploy to Production

```bash
# Build static assets
npm run build

# Start production server
npm start
```

### Environment Variables (Production)

```env
PORT=3000
NODE_ENV=production
ADMIN_API_KEY=your-secure-random-string
```

### Recommended Hosts

**Full Stack** (with email backend):
- Railway
- Render
- DigitalOcean App Platform
- AWS Elastic Beanstalk

**Static Only** (frontend only, no email):
- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages

## 🐛 Troubleshooting

### Email Form Not Working
- Make sure backend server is running: `npm run dev:server`
- Check browser console for errors
- Verify API endpoint in `scripts/forms.js`

### Animations Not Showing
- Check browser console for WebGL errors
- Try forcing animation type in `scripts/performance.js`
- Ensure you're not in "reduced motion" mode in OS settings

### Database Locked Error
- Close all connections to `facilitair-emails.db`
- Delete `.db-shm` and `.db-wal` files if they exist
- Restart the server

### Port Already in Use
```bash
# Change port in package.json or use:
PORT=3001 npm run dev:server
```

## 📚 Learn More

- [Full README](README.md) - Complete documentation
- [GitHub Issues](https://github.com/bledden/facilitair-lp/issues) - Report bugs
- [Email Blake](mailto:blake@facilitair.ai) - Questions

---

**Need Help?** Email [blake@facilitair.ai](mailto:blake@facilitair.ai)

Built with ❤️ for FACILITAIR
