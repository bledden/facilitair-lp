# FACILITAIR Landing Page

A high-performance landing page for FACILITAIR - the multi-agent AI collaboration platform.

## Features

- **Glassmorphic Design**: Premium glass-effect UI with the FACILITAIR color scheme
- **Adaptive Background Animations**:
  - **Desktop/High-Performance**: Fluid physics liquid blob simulation that follows mouse
  - **Mobile/Low-Performance**: Colorful network packet animation
  - **Performance Detection**: Automatically selects appropriate animation based on device capability
- **Responsive Design**: Optimized for all screen sizes and devices
- **Secure Email Backend**: SQLite database with rate limiting and unsubscribe functionality
- **3 Pages**: Landing, About, and Blog
- **Logo Animation**: Spinning logo on capable devices
- **Accessibility**: Respects `prefers-reduced-motion` settings

## Design System

### Colors
- **Facilitair Teal**: `#5CE1E6` (Primary accent, 10% usage)
- **Facilitair Black**: `#100F0D` (Background, 40% usage)
- **Facilitair White**: `#FAFAFA` (Text, 40% usage)
- **Facilitair Gray**: `#D9D9D9` (Borders, 10% usage)

### Typography
- **Font Family**: Montserrat (all weights)
- **Spacing System**: Consistent spacing scale from 0.25rem to 8rem

### Contrast Compliance
All color combinations ensure AAA contrast ratios for accessibility:
- Teal on Black: 5.9:1 contrast
- White on Black: 20.6:1 contrast
- Black on Teal: 5.9:1 contrast

## Project Structure

```
facilitair-lp/
├── index.html              # Landing page
├── about.html              # About page
├── blog.html               # Blog page
├── survey.html             # User survey form
├── logo.png                # FACILITAIR logo
├── package.json            # Dependencies
├── server.js               # Express backend for email handling
├── .env.example            # Environment variables template
├── styles/
│   ├── main.css           # Main styles with glassmorphism
│   └── animations.css     # Animation definitions
├── scripts/
│   ├── performance.js     # Performance detection system
│   ├── animations.js      # Liquid blob & network packet animations
│   └── forms.js           # Email form handling
└── README.md              # This file
```

## Installation

### 1. Install Dependencies

```bash
cd facilitair-lp
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The site will be available at `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
```

## Backend Setup

The backend uses Express.js with SQLite for secure email storage and Resend for email delivery.

### Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
PORT=3000
NODE_ENV=production
BASE_URL=https://your-domain.com
ADMIN_API_KEY=your-secure-api-key-here
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=FACILITAIR <onboarding@facilitair.ai>
```

### Email Service Setup (Resend)

1. **Sign up for Resend**: Visit [resend.com](https://resend.com) and create a free account
2. **Get API Key**: Navigate to [API Keys](https://resend.com/api-keys) and generate a new key
3. **Verify Domain**: Add your domain and verify DNS records (required for production)
4. **Update .env**: Add your `RESEND_API_KEY` and `FROM_EMAIL`

**For Development**: Resend provides test mode that works without domain verification.

### Database

The SQLite database (`facilitair-emails.db`) is created automatically with:

**Subscribers Table**:
- Email hashing for privacy (SHA-256)
- Rate limiting (5 requests/minute per IP)
- Confirmation tokens for double opt-in
- Unsubscribe tokens
- Survey completion tracking
- Timestamp tracking

**User Surveys Table**:
- Planned use cases
- Anticipated usage frequency
- Discovery source
- Background (optional)
- Additional feedback (optional)

### Email Flow

1. **User subscribes** → Receives confirmation email
2. **User clicks confirmation link** → Email confirmed in database → Receives follow-up survey email
3. **User completes survey** → Data saved to `user_surveys` table

### API Endpoints

- `POST /api/subscribe` - Subscribe to email list (sends confirmation email)
- `GET /api/confirm/:token` - Confirm email subscription (sends survey email)
- `POST /api/survey` - Submit user survey responses
- `GET /api/unsubscribe/:token` - Unsubscribe from email list
- `GET /api/stats` - Get subscriber stats (requires API key)

## Deployment

### Option 1: Node.js Server

```bash
# Install dependencies
npm install

# Set environment variables
export NODE_ENV=production
export ADMIN_API_KEY=your-secure-key

# Start server
node server.js
```

### Option 2: Vite Static Site (Frontend Only)

```bash
# Build static files
npm run build

# Preview
npm run preview

# Deploy dist/ folder to any static host
```

**Note**: For email functionality, you'll need to deploy `server.js` separately and update the API endpoint in `scripts/forms.js`.

### Recommended Hosts

#### Full Stack (Frontend + Backend)
- **Railway**: One-click deployment for Node.js apps
- **Render**: Free tier available, automatic deployments
- **DigitalOcean App Platform**: $5/month tier with database
- **AWS Elastic Beanstalk**: Scalable production hosting

#### Static Only (Frontend)
- **Vercel**: Free tier, optimized for Vite
- **Netlify**: Free tier with form handling
- **Cloudflare Pages**: Free unlimited bandwidth
- **GitHub Pages**: Free static hosting

## Performance Optimization

### Background Animation Selection

The site automatically detects device performance and selects the appropriate animation:

1. **Performance Score > 60** (Desktop with good GPU):
   - Liquid blob physics simulation
   - Mouse-interactive
   - Multiple blobs with metaball merging

2. **Performance Score 20-60** (Mobile or integrated GPU):
   - Network packet animation
   - Lower CPU/GPU usage
   - Still visually engaging

3. **Performance Score < 20** (Low-end devices):
   - No background animation
   - Static glassmorphic design

### Factors Considered
- Mobile device detection
- Screen size
- GPU capability (WebGL test)
- Available memory
- FPS measurement
- User's `prefers-reduced-motion` setting

## Customization

### Update Logo

Replace `logo.png` with your own logo (recommended size: 512x512px, transparent PNG).

### Modify Colors

Edit CSS variables in `styles/main.css`:

```css
:root {
    --facilitair-teal: #5CE1E6;
    --facilitair-black: #100F0D;
    --facilitair-white: #FAFAFA;
    --facilitair-gray: #D9D9D9;
}
```

### Change Animation Type

Edit `scripts/performance.js` to force a specific animation:

```javascript
// Force liquid animation
this.animationType = 'liquid';

// Force network animation
this.animationType = 'network';

// Disable animations
this.animationType = 'none';
```

### Survey Questions

The survey collects the following information:

**Required Fields**:
- **Planned Use**: How users intend to use FACILITAIR (free text)
- **Anticipated Usage**: Frequency of usage (Daily, Weekly, Monthly, Project-based)
- **How Found**: Discovery source (Social media, Search, Recommendation, etc.)

**Optional Fields**:
- **Background**: Professional background or expertise
- **Additional Info**: Any other feedback, feature requests, or questions

All responses are stored in the `user_surveys` table and linked to the subscriber record.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Note**: Liquid blob animation requires WebGL support. Network packet animation is the fallback.

## Security Features

- Email hashing (SHA-256) for duplicate detection
- Rate limiting (5 requests/minute per IP)
- Input validation and sanitization
- Secure unsubscribe tokens (32-byte random)
- CORS protection
- SQL injection prevention (parameterized queries)

## License

MIT License - see LICENSE file for details

## Contact

**Blake Ledden**
- Email: blake@facilitair.ai
- GitHub: [@bledden](https://github.com/bledden)
- LinkedIn: [Blake Ledden](https://linkedin.com/in/blakeledden)

---

Built with ❤️ for FACILITAIR - AI That Actually Collaborates
