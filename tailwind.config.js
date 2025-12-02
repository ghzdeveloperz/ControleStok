/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'], // adiciona a Poppins
      },
      keyframes: {
        elastic: {
          '0%': { transform: 'translateX(-50%) scale(0.8)' },
          '40%': { transform: 'translateX(-50%) scale(1.1)' },
          '60%': { transform: 'translateX(-50%) scale(0.95)' },
          '80%': { transform: 'translateX(-50%) scale(1.02)' },
          '100%': { transform: 'translateX(-50%) scale(1)' },
        },
      },
      animation: {
        elastic: 'elastic 0.6s ease-out',
      },
    },
  },
  plugins: [],
};
