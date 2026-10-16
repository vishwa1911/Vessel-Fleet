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
          950: '#f0f9ff', // Airy Sky White
          900: '#ffffff', // Pure White
          850: '#ffffff', // Pure White Card
          800: '#f8fafc', // Light Slate / Off-white
          700: '#e0f2fe', // Sky 100 Border
          600: '#bae6fd', // Sky 200 Border
          500: '#64748b', // Muted Slate
          400: '#475569', // Body Slate
          300: '#334155', // Deep Slate
          200: '#1e293b', // Heading Slate
          100: '#0f172a', // Primary Dark Slate
          50: '#ffffff',  // Pure White
        },
        ocean: {
          600: '#0284c7', // Rich Sky Blue
          500: '#0ea5e9', // Vibrant Sky Blue
          400: '#38bdf8', // Bright Sky Blue
          300: '#7dd3fc', // Soft Sky Blue
          200: '#bae6fd', // Ice Sky Blue
          100: '#e0f2fe', // Lightest Sky Tint
          50: '#f0f9ff',  // Pure Sky Tint
        },
        teal: {
          600: '#0369a1',
          500: '#0284c7',
          400: '#38bdf8',
        },
      },
      boxShadow: {
        'sky-glow': '0 4px 20px -2px rgba(14, 165, 233, 0.12), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'sky-glow-lg': '0 10px 30px -4px rgba(14, 165, 233, 0.2), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
