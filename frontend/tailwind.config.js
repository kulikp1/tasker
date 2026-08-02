/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Caveat"', 'ui-rounded', 'cursive'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        surface: {
          light: '#e9eaf0',
          card: '#ffffff',
          DEFAULT: '#0f0f16',
          dark: '#0a0a10',
        },
        accent: {
          50: '#f1eefe',
          100: '#e3ddfd',
          200: '#c8b8fb',
          300: '#a98af8',
          400: '#8b5cf6',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
        },
        mint: {
          400: '#34d8b0',
          500: '#14b896',
        },
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.24)',
        glow: '0 0 24px rgba(124, 58, 237, 0.35)',
      },
      backdropBlur: {
        glass: '18px',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'pop-in': { '0%': { opacity: 0, transform: 'scale(0.96) translateY(6px)' }, '100%': { opacity: 1, transform: 'scale(1) translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'pop-in': 'pop-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
