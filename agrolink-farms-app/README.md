# AgroLink Farms

> Verified farm animals. Direct from trusted farms.

AgroLink Farms is a web-based livestock marketplace connecting verified farms with buyers. The platform prioritizes trust, transparency, and simplicity by providing verified listings, farm profiles, and a clean, modern user experience.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git

### Setup

1. **Clone and Install**
   ```bash
   cd agrolink-farms-app
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # Reusable React components
├── lib/              # Utilities and Supabase client
├── types/            # TypeScript type definitions
public/
├── images/
│   ├── animals/      # Livestock imagery
│   └── farms/        # Farm imagery
```

## 🎨 Design System

### Colors
- **Primary:** White (#FFFFFF), Off-white (#F9F7F4)
- **Secondary:** Earthy Green (#2D5016), Olive (#6B8E23), Sage (#9CAF88)
- **Neutrals:** Gray scale for text and borders

### Typography
- **Font:** Inter, Lato, sans-serif
- **Layout:** Card-based with soft shadows and generous whitespace

### Components
- Minimalist design with soft shadows (`shadow-soft`, `shadow-medium`)
- Responsive card layouts
- Accessible form elements

## 🔧 Development Commands

```bash
npm run dev         # Start dev server (hot-reload)
npm run build       # Production build
npm start           # Start production server
npm run lint        # Run ESLint
npm run type-check  # TypeScript validation
```

## 🗂️ Core Data Models

### User
- Authentication role: buyer | seller | admin
- Verification status for sellers
- Profile information (name, email, contact)

### Farm
- Owner and profile info
- Location and verification status
- Ratings and certification details

### Animal
- Category: Cows, Fish, Poultry, Goats, Dogs, Others
- Breed, age, weight, health status
- Price, availability, images
- Vaccination and health records

### Order
- Buyer and animal selection
- Inquiry or purchase status
- Timestamps and notes

## 📋 MVP Features

### Phase 1 (MVP)
- ✅ User authentication (Buyer, Seller, Admin roles)
- ✅ Animal listings with categories
- ✅ Seller profile pages
- ✅ Basic inquiry/order request system
- ✅ Admin verification workflow

### Phase 2 (Post-MVP)
- In-app messaging
- Vet and inspection booking
- Delivery scheduling
- Market analytics

## 🖼️ Asset Guidelines

### Image Requirements
- Format: WebP only
- Max size: 200KB per image
- Source: Unsplash, Pexels, Freepik (with attribution)

### Directory Structure
```
public/images/
├── animals/          # Livestock photos
│   └── {category}-{breed}-{number}.webp
└── farms/            # Farm environments
    └── farm-{number}.webp
```

### Naming Convention
```
{animal-type}-{breed}-{variant}-{number}.webp
Example: cow-holstein-farm-01.webp
```

## 🔐 Supabase Setup

### Required Tables

1. **users** - User accounts and roles
2. **farms** - Farm profiles
3. **animals** - Animal listings
4. **orders** - Purchase inquiries/orders
5. **reviews** - User ratings and feedback

### Row Level Security (RLS)
- Enable RLS on all tables
- Implement role-based access policies
- Secure authenticated endpoints

## 🎯 Code Standards

### Components
- Use functional components with TypeScript
- Keep components focused and reusable
- Use Tailwind CSS for all styling
- Keep functions under 50 lines

### Naming Conventions
- **Components:** PascalCase (`AnimalCard.tsx`)
- **Utils/Hooks:** camelCase (`useAuth.ts`)
- **Types:** PascalCase interfaces (`Animal.ts`)
- **Styles:** Tailwind kebab-case

### Type Safety
- Type all props and return values
- Use interfaces for component props
- Avoid `any` types

## 🚀 Deployment

### Vercel (Frontend)
```bash
npm run build
# Vercel auto-deploys from git
```

### Supabase (Backend)
- Database hosted on Supabase
- Auto-scales with load
- Built-in backups and recovery

## 📝 Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🤝 Contributing

1. Create a feature branch
2. Make changes following code standards
3. Test locally with `npm run dev`
4. Run linting: `npm run lint`
5. Run type-check: `npm run type-check`
6. Submit PR with description

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📄 License

Private project - AgroLink Farms
