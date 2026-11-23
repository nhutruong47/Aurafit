/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          espresso: '#3A302A',
          mocha: '#5A463A',
          cream: '#F6F1E8',
          surface: '#FFFCF7',
          champagne: '#D6B87E',
          gold: '#756536',
          ink: '#211E1B',
          muted: '#6B6259',
          line: '#DED2C2',
        },
      },
    },
  },
  plugins: [],
}
