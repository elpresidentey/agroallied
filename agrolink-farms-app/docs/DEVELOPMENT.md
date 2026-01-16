# Development Guide - AgroLink Farms

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.local.example .env.local

# 3. Start development server
npm run dev

# 4. Open browser
# Visit http://localhost:3000
```

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   ├── animals/
│   │   └── page.tsx          # Browse animals
│   ├── farms/
│   │   └── page.tsx          # Browse farms
│   ├── api/                  # API routes (future)
│   ├── globals.css           # Global styles & design tokens
│   └── loading.tsx           # Loading component
├── components/               # Reusable React components
│   ├── Header.tsx            # Navigation header
│   ├── Footer.tsx            # Footer
│   ├── Hero.tsx              # Landing hero section
│   ├── Categories.tsx        # Category browse section
│   ├── AnimalCard.tsx        # Animal listing card
│   ├── FarmCard.tsx          # Farm profile card
│   └── index.ts              # Component exports
├── lib/
│   └── supabase.ts           # Supabase client config
├── types/
│   └── index.ts              # TypeScript interfaces
└── public/
    └── images/
        ├── animals/          # Livestock photos
        └── farms/            # Farm environment photos

docs/
├── DATABASE_SCHEMA.md        # Supabase schema & setup
```

## 🎨 Design System

### Colors
Access through Tailwind configuration:

```tsx
// Primary (White)
className="bg-primary"              // #FFFFFF
className="bg-primary-light"        // #F9F7F4

// Secondary (Earthy Green)
className="bg-secondary"            // #2D5016
className="bg-secondary-light"      // #6B8E23
className="bg-secondary-lighter"    // #9CAF88
```

### Components & Patterns
```tsx
// Card component
<div className="card">Content</div>

// Soft shadows
<div className="shadow-soft">...</div>
<div className="shadow-medium">...</div>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

## 🔑 Key Components

### Header
```tsx
import Header from '@/components/Header';

// Usage
export default function Page() {
  return (
    <>
      <Header />
      {/* page content */}
    </>
  );
}
```

**Features:**
- Navigation links (Browse, Become Seller)
- Authentication buttons (Sign In, Sign Up)
- Responsive mobile menu
- Sticky positioning

### AnimalCard
```tsx
import { AnimalCard } from '@/components/index';
import type { Animal } from '@/types';

<AnimalCard animal={animalData} farmName="Green Farm" />
```

**Props:**
- `animal: Animal` - Animal data object
- `farmName: string` - Display farm name

**Features:**
- Image carousel (primary image)
- Health/vaccination badges
- Price formatting with currency
- Hover effects
- Responsive design

### FarmCard
```tsx
import { FarmCard } from '@/components/index';
import type { Farm } from '@/types';

<FarmCard farm={farmData} animalCount={15} />
```

**Props:**
- `farm: Farm` - Farm profile data
- `animalCount?: number` - Number of animals (optional)

**Features:**
- Verification badge
- Rating display
- Active listings count
- Certifications
- CTA button

## 📝 Common Tasks

### Adding a New Page

1. Create directory under `src/app/`:
```
src/app/my-page/page.tsx
```

2. Add component:
```tsx
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Page Title - AgroLink Farms',
  description: 'Page description',
};

export default function MyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Content */}
      </main>
      <Footer />
    </div>
  );
}
```

### Creating a New Component

```tsx
// src/components/MyComponent.tsx
import { ReactNode } from 'react';

interface MyComponentProps {
  title: string;
  children: ReactNode;
}

export default function MyComponent({ title, children }: MyComponentProps) {
  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-secondary mb-4">{title}</h2>
      {children}
    </div>
  );
}
```

### Using Supabase

```tsx
'use client'; // Client component for interactivity

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Animal } from '@/types';

export default function AnimalsList() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnimals = async () => {
      const { data, error } = await supabase
        .from('animals')
        .select('*')
        .limit(10);

      if (error) {
        console.error('Error fetching animals:', error);
      } else {
        setAnimals(data || []);
      }
      setLoading(false);
    };

    fetchAnimals();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {animals.map((animal) => (
        <div key={animal.id} className="card">
          {animal.breed}
        </div>
      ))}
    </div>
  );
}
```

## 🧪 Development Commands

```bash
# Development server with hot-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type checking
npm run type-check
```

## 🔐 Authentication Setup

Coming soon - Supabase Auth integration guide.

## 📊 Data Fetching Patterns

### Server Component (Recommended for initial data)
```tsx
import { supabase } from '@/lib/supabase';

export default async function Page() {
  const { data } = await supabase
    .from('animals')
    .select('*')
    .limit(10);

  return (
    // Render data
  );
}
```

### Client Component (For interactive features)
```tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Component() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('table').select('*');
      setData(data);
    };
    fetch();
  }, []);

  return // JSX
}
```

## 🎯 Type Safety

All data models are typed in `src/types/index.ts`:

```tsx
import type { Animal, Farm, User, Order } from '@/types';

// Use in components
const animal: Animal = {
  id: '123',
  breed: 'Holstein',
  category: 'cows',
  // ... other fields
};
```

## 📱 Responsive Design

AgroLink uses Tailwind's responsive breakpoints:

```tsx
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>

<p className="text-sm sm:text-base md:text-lg">
  {/* Font size adjusts per breakpoint */}
</p>
```

## 🐛 Debugging

### NextJS Debugging
```tsx
// Use console.log (visible in terminal during dev)
console.log('Debug info:', data);

// Or use React DevTools
// Chrome extension: React Developer Tools
```

### Supabase Issues
```tsx
// Check RLS policies
// Supabase Dashboard > Database > Policies

// Enable query logging
const { data, error } = await supabase
  .from('table')
  .select('*');

if (error) {
  console.error('Supabase error:', error);
}
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)

## 🤝 Code Standards

### Naming Conventions
- **Components:** PascalCase (`AnimalCard.tsx`)
- **Utilities:** camelCase (`formatPrice.ts`)
- **Types:** PascalCase interfaces (`Animal.ts`)
- **CSS classes:** kebab-case (Tailwind)

### Best Practices
- Keep components under 50 lines when possible
- Use TypeScript interfaces for all props
- Avoid `any` types
- Use `'use client'` only when needed (interactivity)
- Leverage server components for data fetching
- Write semantic HTML

## 🚀 Deployment Preparation

1. **Environment Variables**
   - Update `.env.local` with production values
   - Use Vercel secrets for sensitive data

2. **Database Migrations**
   - Test schema on production database
   - Verify RLS policies

3. **Performance**
   - Use Next.js Image component
   - Optimize images to WebP format
   - Enable compression

4. **Testing**
   ```bash
   npm run build
   npm start
   ```

---

Happy coding! 🎉
