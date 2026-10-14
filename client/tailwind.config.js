/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        maritime: {
          950: '#060e1a', // Midnight Ocean
          900: '#0b192c', // Deep Navy
          850: '#0f223d', // Card Dark
          800: '#1e293b', // Marine Slate Dark
          700: '#334155', // Slate
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
          50: '#f8fafc',
        },
        ocean: {
          500: '#0284c7', // Primary Ocean Blue
          600: '#0369a1',
          400: '#38bdf8',
          100: '#e0f2fe',
        },
        teal: {
          500: '#0d9488', // Maritime High Seas Teal
          600: '#0f766e',
          400: '#14b8a6',
        },
      },
    },
  },
  plugins: [],
}
