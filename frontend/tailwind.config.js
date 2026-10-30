/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#02070A',
        electric: {
          DEFAULT: '#0297DE',
          400: '#38BDF8',
          500: '#0297DE',
          600: '#0284C7',
          glow: 'rgba(2, 151, 222, 0.25)',
        },
        cantaloupe: {
          DEFAULT: '#FC734D',
          400: '#FF8A65',
          500: '#FC734D',
          600: '#EA580C',
          glow: 'rgba(252, 115, 77, 0.25)',
        },
        surface: {
          900: '#030A10',
          800: '#07121D',
          700: '#0D1B2A',
          600: '#152538',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'electric-glow': '0 0 25px -5px rgba(2, 151, 222, 0.4)',
        'cantaloupe-glow': '0 0 25px -5px rgba(252, 115, 77, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
};
