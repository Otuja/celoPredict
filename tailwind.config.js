/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        celo: {
          green: '#35D07F',
          gold: '#FBCC5C',
          dark: '#1E1E1E',
          darker: '#111111',
          light: '#FFFFFF',
        }
      }
    },
  },
  plugins: [],
}