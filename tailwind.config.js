/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#00B7AF',
          dark: '#009B94',
          light: '#E0F7F5',
          bg: '#F8FFFE',
        },
        sidebar: '#1E293B',
        danger: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
      },
    },
  },
  plugins: [],
};
