# AgroLink Farms - Development Guidelines

## Project Overview
AgroLink Farms is a Next.js-based livestock marketplace connecting verified farms with buyers.

**Stack:** Next.js 14+ | TypeScript | Tailwind CSS | Supabase

## Architecture

### Directory Structure
- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - Reusable React components
- `src/lib/` - Utilities, helpers, and Supabase client
- `src/types/` - TypeScript type definitions
- `public/images/animals/` - Livestock imagery
- `public/images/farms/` - Farm imagery

### Design System
- **Primary:** White/Off-white (#FFFFFF, #F9F7F4)
- **Secondary:** Earthy Green (#2D5016, #6B8E23, #9CAF88)
- **Typography:** Inter/Lato sans-serif
- **Layout:** Card-based with soft shadows and whitespace

## Development Standards

### Component Patterns
- Use functional components with TypeScript interfaces
- Implement proper error boundaries
- Keep components focused and reusable
- Use Tailwind CSS for all styling

### Code Quality
- Follow ESLint configuration
- Type all props and return values
- Use meaningful variable and function names
- Keep functions under 50 lines when possible

### Naming Conventions
- Components: PascalCase (e.g., `AnimalCard.tsx`)
- Utils/Hooks: camelCase (e.g., `useAuth.ts`)
- Types: PascalCase interfaces (e.g., `Animal.ts`)
- CSS classes: kebab-case via Tailwind

## Feature Implementation Order
1. Authentication (Supabase Auth)
2. Animal listings and categories
3. Seller profiles
4. Buyer dashboard
5. Admin panel (verification)
6. Inquiry/order system

## Build & Run Commands
```bash
npm run dev       # Start development server
npm run build     # Production build
npm run lint      # Run ESLint
npm run type-check # TypeScript validation
```

## Important Notes
- All images must be WebP format, <200KB
- Use Next.js Image component for optimization
- Implement responsive design for mobile/desktop
- Follow MVPs scope - avoid feature creep
