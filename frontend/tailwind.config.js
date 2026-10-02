/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17312e',
        forest: '#246b5b',
        mint: '#e3f1ec',
        coral: '#d56f4f',
        canvas: '#f4f7f5',
        line: '#dfe7e2',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        panel: '0 18px 50px -34px rgba(23, 49, 46, 0.32)',
      },
    },
  },
  plugins: [],
};