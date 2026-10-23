/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        untad: {
          blue: '#004A99',
          yellow: '#FFC72C',
          dark: '#002B5B'
        }
      }
    },
  },
  plugins: [],
}
