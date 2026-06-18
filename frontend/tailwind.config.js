/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',  // Светло-зеленый фон
          100: '#dcfce7',
          500: '#22c55e', // Главный зеленый цвет кнопок
          600: '#16a34a', // Цвет кнопок при наведении
          900: '#14532d', // Темно-зеленый для текста
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}