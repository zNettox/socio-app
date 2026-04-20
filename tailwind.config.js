/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
      colors: {
        amber: {
          brand: '#BA7517',
          light: '#FAEEDA',
          mid: '#FAC775',
          dark: '#854F0B',
        },
      },
    },
  },
  plugins: [],
}
