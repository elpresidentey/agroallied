# ⚡ Quick Reference - Phase 3

## 🚀 Start Here
```bash
npm run dev
# Visit http://localhost:3000
```

## 📍 Key URLs

| Page | URL | Purpose |
|------|-----|---------|
| Home | / | Hero section |
| Browse Animals | /animals | Real data listing |
| Animal Detail | /animals/animal-001 | Product page |
| New Listing | /seller/listings/new | Seller form |
| Seller Dashboard | /seller/dashboard | Stats & actions |
| Seller Listings | /seller/listings | Inventory |
| Admin Panel | /admin | Moderation |
| User Profile | /profile | Account |
| Orders | /orders | History |

## 🔐 Test Accounts

```
Admin
Email: admin@agrolink.com
Pass: password123

Seller 1
Email: seller1@farm.com
Pass: password123

Buyer
Email: buyer1@mail.com
Pass: password123
```

## 📦 What's Ready

✅ Animal browsing with real data
✅ Search & filter by category
✅ Animal detail pages
✅ Seller listing creation
✅ Type-safe database queries
✅ Responsive design
✅ Protected routes
✅ Auth system

## 🗂️ Main Folders

```
src/app/
├── animals/        # Browse & detail pages
├── seller/         # Seller features
├── admin/          # Admin dashboard
├── profile/        # User account
└── ...

src/components/
├── Header.tsx
├── Footer.tsx
├── AnimalCard.tsx
└── ...

src/lib/
├── api.ts          # Data fetching
├── auth-context.tsx# Auth state
└── supabase.ts     # DB client
```

## 🔗 API Functions

```typescript
// Animals
getAnimals()                    // All animals
getAnimalById(id)              // Single animal ✨ NEW
getAnimalsByCategory(type)     // By type
searchAnimals(query)           // Search

// Farms
getFarms()                     // All farms
getFarmById(id)                // Single farm

// Orders
createOrder()                  // Create inquiry
getOrders()                    // List orders

// Users
getUserById()                  // User info
getStats()                     // Platform stats
```

## 📊 Database Tables

- `animals` - 17 test records ready ✅
- `farms` - 4 test records ready ✅
- `users` - 6 test records ready ✅
- `orders` - 3 test records ready ✅

## 🧪 Testing Flow

1. **Seed Database**
   - Run `SEED_DATA.sql` OR `node seed.js`
   
2. **Auth Test**
   - Go to `/signup` → Create account
   - Go to `/profile` → View account
   
3. **Browsing**
   - Go to `/animals` → See listings
   - Click on animal → View detail
   
4. **Seller**
   - Login as seller1@farm.com
   - Go to `/seller/listings/new`
   - Fill form & submit

## 📝 Forms Available

- Sign Up Form ✅
- Login Form ✅
- Listing Creation ✅
- Order Form (coming Phase 4)

## 🎯 Key Components

| Component | File | Purpose |
|-----------|------|---------|
| AnimalCard | components/ | Animal preview |
| Header | components/ | Navigation |
| Footer | components/ | Site footer |

## ⚙️ Commands

```bash
npm run dev         # Start dev server
npm run build       # Production build
npm run lint        # ESLint check
npm run type-check  # TypeScript check
npm test            # Run tests
```

## 🐛 Debug Tips

- **Check console** for React errors
- **Verify Supabase** connection
- **Confirm seed data** was loaded
- **Run type-check** before commit
- **Check Auth** in browser DevTools

## 📚 Documentation

- `PHASE3_GUIDE.md` - Complete testing guide
- `PHASE3_COMPLETE.md` - Full summary
- `PHASE2_COMPLETION.md` - Auth system
- `PHASE1_COMPLETION.md` - Initial setup

## 🔄 Data Flow

```
Supabase Database
      ↓
   api.ts functions
      ↓
  React components
      ↓
  User sees data
```

## ✨ Next Phase

Order placement & payment integration coming in Phase 4

## 💡 Tips

1. Use `Ctrl+K` in VS Code for file search
2. Check browser DevTools Network tab
3. Look at console for error messages
4. Test with demo accounts first
5. Read PHASE3_GUIDE.md for details

---

**Status:** ✅ Phase 3 Complete
**Ready:** Yes, test with `npm run dev`
