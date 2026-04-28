import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './constants/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        lexend: ['Lexend', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream:     '#FDFBF7',
        'soft-blue':   '#F0F4F8',
        'soft-peach':  '#FFF5F0',
        lavender:  '#F3F0FF',
        mint:      '#F0FFF4',
        purple:    '#6C5CE7',
        'purple-light': '#A29BFE',
        orange:    '#FF9F43',
        'orange-light': '#FFEAA7',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 24px rgba(108, 92, 231, 0.08)',
        'soft-lg': '0 8px 40px rgba(108, 92, 231, 0.12)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
