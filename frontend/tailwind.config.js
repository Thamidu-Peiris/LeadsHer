/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold:         '#d4af35',
        'dusty-rose': '#D4748F',
        'dark-bg':    '#0A0A0A',
        'dark-section':'#111111',
        'dark-card':  '#161616',
        brand: {
          50:  '#fdf4ff',
          100: '#f9e8ff',
          200: '#f3d0fe',
          300: '#e9a8fc',
          400: '#d973f7',
          500: '#c44def',
          600: '#a42ed4',
          700: '#8721ae',
          800: '#711d8e',
          900: '#5c1a72',
          950: '#3d0550',
        },
      },
      fontFamily: {
        sans:       ['Manrope', 'system-ui', 'sans-serif'],
        manrope:    ['Manrope', 'sans-serif'],
        cormorant:  ['Cormorant Garamond', 'serif'],
        'dm-sans':  ['DM Sans', 'sans-serif'],
        playfair:   ['Playfair Display', 'serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        display:    ['Playfair Display', 'Georgia', 'serif'],
      },
      borderRadius: {
        eight: '8px',
      },
    },
  },
  plugins: [],
};
