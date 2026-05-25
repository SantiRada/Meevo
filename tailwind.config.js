/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        meevo: {
          purple: '#7315E6',
          bg: '#070709',
          panel: '#0D0D0F',
          card: '#1A1A1D',
          border: '#212124',
          text: {
            primary: '#FFFFFF',
            secondary: '#CCCCCC',
            tertiary: '#777777',
            inverse: '#070709',
          }
        }
      },
      fontFamily: {
        sans: ['"Readex Pro"', 'sans-serif'],
        logo: ['"Nico Moji"', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
      }
    },
  },
  plugins: [],
}
