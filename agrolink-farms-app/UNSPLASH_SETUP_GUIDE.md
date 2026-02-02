# 🖼️ Unsplash API Setup Guide

## Get Your Free Unsplash API Key

### Step 1: Create an Unsplash Account
1. Go to [unsplash.com](https://unsplash.com)
2. Sign up for a free account (or log in if you have one)

### Step 2: Register as a Developer
1. Visit [unsplash.com/developers](https://unsplash.com/developers)
2. Click "Register as a Developer"
3. Accept the API Terms

### Step 3: Create a New Application
1. Go to [unsplash.com/oauth/applications](https://unsplash.com/oauth/applications)
2. Click "New Application"
3. Fill in the application details:
   - **Application name**: `AgroLink Farms`
   - **Description**: `Agricultural marketplace with dynamic farm imagery`
   - **Website**: `http://localhost:3000` (for development)
4. Accept the terms and click "Create application"

### Step 4: Get Your Access Key
1. On your application page, scroll down to find your **Access Key**
2. Copy this key - it looks like: `abc123def456...`

### Step 5: Update Your Environment Variables
1. Open `agrolink-farms-app/.env.local`
2. Replace the demo key with your real key:

```bash
# Replace this line:
UNSPLASH_ACCESS_KEY=demo_key_will_fallback_to_svg

# With your real key:
UNSPLASH_ACCESS_KEY=your_actual_access_key_here

# Enable Unsplash API:
ENABLE_UNSPLASH=true
```

### Step 6: Restart Your Dev Server
```bash
npm run dev
```

## ✅ What You Get

- **50 requests/hour** in demo mode (perfect for development)
- **High-quality agricultural photos** from professional photographers
- **Automatic attribution** handled by the system
- **Fallback to beautiful SVG** if API is unavailable

## 🚀 Production Setup

For production, you'll need to:
1. Apply for higher rate limits (5000 requests/hour)
2. Update your application URL to your production domain
3. Follow Unsplash's attribution guidelines

## 🎨 Current Fallback

The system now uses a beautiful farm landscape SVG as fallback instead of the plain green background. This ensures your site always looks professional even without API access.

## 🔧 Testing

Visit these pages to see the images:
- **Main site**: http://localhost:3000
- **Image test**: http://localhost:3000/image-test
- **Debug page**: http://localhost:3000/image-debug

The system will automatically:
- Try to load real photos from Unsplash
- Fall back to the beautiful SVG if API is unavailable
- Cache successful API responses for better performance