/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gyxer: {
          50: '#fff5f5',
          100: '#ffe0e0',
          200: '#ffc7c7',
          300: '#ff9999',
          400: '#e85555',
          500: '#C8232C',
          600: '#B01E26',
          700: '#8E1820',
          800: '#6C121A',
          900: '#4A0C12',
        },
        dark: {
          50: '#f5f5f5',
          100: '#e8e8e8',
          200: '#d4d4d4',
          300: '#a3a3a3',
          400: '#737373',
          500: '#525252',
          600: '#3a3a3a',
          700: '#2a2a2a',
          800: '#1f1f1f',
          900: '#141414',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card': '0 2px 12px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 20px rgba(0, 0, 0, 0.12)',
        'toolbar': '0 1px 3px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};
