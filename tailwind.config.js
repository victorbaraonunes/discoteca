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
        wine: {
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f9d0d8',
          300: '#f4a9b8',
          400: '#ec758f',
          500: '#df436a',
          600: '#c82451',
          700: '#a81740',
          800: '#8c1638',
          900: '#771634',
          950: '#440719',
          primary: '#be123c',
          accent: '#e11d48',
        },
        vinyl: {
          dark: '#121214',
          darker: '#0a0a0c',
          card: '#171417',
          border: '#2a2228',
          wine: '#be123c',
          groove: '#241e23',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
}
