/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          50: '#fdf2f4',
          100: '#fce7eb',
          200: '#f7d0d8',
          300: '#f0a9b8',
          400: '#e57790',
          500: '#d94c6e',
          600: '#c22d54',
          700: '#a31f41',
          800: '#881d39',
          900: '#731c34',
          950: '#430b1b',
        },
        champagne: {
          50: '#fffbf0',
          100: '#fef4d6',
          200: '#fce5ab',
          300: '#f9cf76',
          400: '#f5b142',
          500: '#ef941d',
          600: '#d97412',
          700: '#b45212',
          800: '#904016',
          900: '#763516',
        },
        velvet: {
          900: '#230a14',
          950: '#14040a',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        cursive: ['Caveat', 'cursive']
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(217, 76, 110, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(217, 76, 110, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
