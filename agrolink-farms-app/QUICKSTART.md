# Quick Start Guide

## 1. Install Dependencies
```bash
npm install
```

## 2. Configure Environment
```bash
# Copy the example env file
cp .env.local.example .env.local

# Edit .env.local and add your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=your_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## 3. Start Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

## 4. Available Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint checks |
| `npm run type-check` | TypeScript validation |

## 5. Project Setup Checklist

- [x] Next.js 16+ with TypeScript
- [x] Tailwind CSS configured with AgroLink design system
- [x] ESLint configured
- [x] Supabase client setup
- [x] Core types defined
- [x] Environment variables template

## 6. Next Steps

1. **Set up Supabase Database**
   - Create Supabase project
   - Create tables: users, farms, animals, orders, reviews
   - Enable Row Level Security (RLS)
   - Add your credentials to `.env.local`

2. **Create Core Components**
   - Navigation header
   - Hero/landing section
   - Animal listing cards
   - Seller profile card
   - Authentication forms

3. **Build Key Pages**
   - Home page with search
   - Animal listing page
   - Animal detail page
   - Seller profile page
   - Admin dashboard

4. **Implement Authentication**
   - Supabase Auth integration
   - User role management
   - Protected routes

## 7. Design Resources

### Colors
- Primary White: `#FFFFFF`
- Primary Light: `#F9F7F4`
- Secondary Green: `#2D5016`
- Olive: `#6B8E23`
- Sage: `#9CAF88`

### Tailwind Classes
- Cards: `card` or `rounded-lg shadow-soft`
- Soft shadows: `shadow-soft`
- Medium shadows: `shadow-medium`

## 8. Common Tasks

### Add a new page
```bash
# Create src/app/[page]/page.tsx
# Automatically routed to /[page]
```

### Create a new component
```tsx
// src/components/MyComponent.tsx
interface MyComponentProps {
  // Define props
}

export default function MyComponent(props: MyComponentProps) {
  return <div></div>;
}
```

### Use Supabase client
```tsx
import { supabase } from '@/lib/supabase';

// Use in components with useEffect
const { data, error } = await supabase
  .from('animals')
  .select('*');
```

## 9. Troubleshooting

**Port 3000 already in use:**
```bash
npm run dev -- -p 3001
```

**ESLint errors:**
```bash
npm run lint
```

**Type errors:**
```bash
npm run type-check
```

## 10. Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

---

**Happy coding! 🚀**
