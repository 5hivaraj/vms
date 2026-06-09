/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        kiosk: ['2rem', { lineHeight: '1.2' }],
        'kiosk-lg': ['3rem', { lineHeight: '1.1' }],
        'kiosk-xl': ['4rem', { lineHeight: '1' }],
      },
      minHeight: {
        touch: '56px',
        'touch-lg': '72px',
      },
      keyframes: {
        'slide-in': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
