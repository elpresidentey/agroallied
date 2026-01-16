# Setup Instructions

## ✅ What's Included

Your AgroLink Farms project is now ready with:

- ✅ Next.js 16 with TypeScript
- ✅ Tailwind CSS with AgroLink design system
- ✅ ESLint configured
- ✅ Supabase client setup
- ✅ Core React components (Header, Footer, Cards)
- ✅ Landing page with Hero section
- ✅ Browse pages (Animals, Farms)
- ✅ Type definitions for all data models
- ✅ Database schema documentation
- ✅ Development guide

## 🔧 Step 1: Install Dependencies ✅ DONE

All npm packages are installed. Current dependencies:
- next@16
- react@19
- typescript
- tailwindcss
- @supabase/supabase-js

## 🌐 Step 2: Setup Supabase

### Create a Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Sign up with email or GitHub
3. Create a new organization

### Create a Project
1. Click "New Project"
2. Enter project name: `agrolink-farms`
3. Set strong database password
4. Select closest region
5. Wait for provisioning (2-3 minutes)

### Get Your Credentials
1. Go to Settings > API
2. Copy these two values:
   - **Project URL** → NEXT_PUBLIC_SUPABASE_URL
   - **anon public key** → NEXT_PUBLIC_SUPABASE_ANON_KEY

### Setup Your Environment File
1. Open `.env.local` in your project
2. Paste your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Save the file

## 🗄️ Step 3: Setup Database Schema

### Using SQL Editor (Recommended)

1. Open your Supabase project
2. Go to **SQL Editor** in left sidebar
3. Click **New Query**
4. Copy and paste the SQL from [docs/DATABASE_SCHEMA.md](../docs/DATABASE_SCHEMA.md)
5. Click **Run**
6. Wait for tables to be created

### Verify Tables Created
1. Go to **Database** in left sidebar
2. Under **Tables**, you should see:
   - users
   - farms
   - animals
   - orders
   - reviews

### ✅ If you see all 5 tables, you're good to go!

## 📸 Step 4: Setup Storage (Optional - for images)

1. Go to **Storage** in Supabase Dashboard
2. Create two new buckets:
   - **animal-images** (for livestock photos)
   - **farm-images** (for farm environment photos)
3. Set both to "Public" for easier access

## 🚀 Step 5: Start Development

```bash
# Navigate to project
cd c:\Users\hp\agrolink-farms-app

# Start development server
npm run dev
```

Visit: **http://localhost:3000**

You should see the AgroLink Farms landing page with:
- Navigation header
- Hero section
- Category cards
- Featured farms section (placeholder)
- Call-to-action section
- Footer

## 🧪 Step 6: Test Supabase Connection

1. In VS Code, open terminal
2. Run: `npm run dev`
3. Open browser to http://localhost:3000
4. Open browser DevTools (F12)
5. Go to **Console** tab
6. Check for any error messages
7. No errors = ✅ Supabase is connected!

## 📝 Next Steps (Choose One)

### Option A: Build Authentication
Create login/signup pages with Supabase Auth:
- User registration
- Email verification
- Login/logout
- Profile management

**Start here:** See [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) > Authentication Setup

### Option B: Create Sample Data
Add test farms and animals to database:
- Insert 5 test farms
- Add 20 test animals
- Create sample users

**Start here:** Go to Supabase Dashboard > SQL Editor > Run sample data queries

### Option C: Build Core Features
Implement core functionality:
- Animal search and filtering
- Farm profiles
- Order/inquiry system

**Start here:** See [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) > Common Tasks

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env.local` | Environment variables (YOUR credentials go here) |
| `src/app/page.tsx` | Home page |
| `src/components/` | Reusable UI components |
| `src/lib/supabase.ts` | Supabase client configuration |
| `src/types/index.ts` | TypeScript type definitions |
| `docs/DATABASE_SCHEMA.md` | Database schema reference |
| `docs/DEVELOPMENT.md` | Development guide |

## ⚡ Commands Reference

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Create production build
npm start            # Start production server
npm run lint         # Check code quality
npm run type-check   # Verify TypeScript types
```

## 🆘 Troubleshooting

### "Cannot find module '@/lib/supabase'"
- Run: `npm install`
- Restart VS Code

### "NEXT_PUBLIC_SUPABASE_URL is missing"
- Check `.env.local` file exists
- Verify credentials are correct
- Restart dev server: `npm run dev`

### Database tables not visible in Supabase
- Make sure you ran the SQL schema
- Refresh browser
- Check SQL execution didn't have errors

### Build errors
```bash
npm run type-check   # Find TypeScript errors
npm run lint         # Check ESLint issues
```

## ✅ Checklist

Before moving to the next phase:

- [ ] Supabase project created
- [ ] Database credentials in `.env.local`
- [ ] Database schema created (all 5 tables visible)
- [ ] `npm run dev` runs without errors
- [ ] http://localhost:3000 loads the landing page
- [ ] No console errors in browser
- [ ] Storage buckets created (optional)

## 📚 Documentation

- **Project Overview:** [README.md](../README.md)
- **Quick Start:** [QUICKSTART.md](../QUICKSTART.md)
- **Database:** [docs/DATABASE_SCHEMA.md](../docs/DATABASE_SCHEMA.md)
- **Development:** [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md)

## 🎉 You're All Set!

Your AgroLink Farms development environment is ready. Start with building authentication or adding sample data, then move to core features.

Questions? Check the docs or review the [PRD](https://example.com) for requirements.

Happy coding! 🚀
