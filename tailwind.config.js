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
                meevo: {
          purple: 'var(--color-purple)',
            'purple-active': 'var(--color-purple-active)',
          surface: {
            0: 'var(--color-surface-0)',
            1: 'var(--color-surface-1)',
            2: 'var(--color-surface-2)',
            3: 'var(--color-surface-3)',
            4: 'var(--color-surface-4)',
            5: 'var(--color-surface-5)',
            6: 'var(--color-surface-6)',
          },
          bg: 'var(--color-bg)',
          panel: 'var(--color-panel)',
          canvas: 'var(--color-canvas)',
          grid: 'var(--color-grid)',
          card: 'var(--color-card)',
          border: 'var(--color-border)',
          text: {
            primary: 'var(--color-text-primary)',
            secondary: 'var(--color-text-secondary)',
            tertiary: 'var(--color-text-tertiary)',
            inverse: 'var(--color-text-inverse)',
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
// trigger recompile 2
