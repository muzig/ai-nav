/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        outlier: ['JetBrains Mono', 'Geist Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
      },
    },
  },
  plugins: [],
};
