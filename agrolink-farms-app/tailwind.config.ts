import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ffffff',
          light: '#f9f7f4',
        },
        secondary: {
          DEFAULT: '#2d5016', // Forest Green
          light: '#6b8e23', // Olive
          lighter: '#9caf88', // Sage
        },
        neutral: {
          50: '#f9f9f9',
          100: '#f3f3f3',
          200: '#e8e8e8',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Lato"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.06)',
        medium: '0 4px 12px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 25px rgba(0, 0, 0, 0.1)',
      },
      spacing: {
        gutter: '1rem',
        section: '2rem',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
      },
    },
  },
  plugins: [],
};

export default config;
