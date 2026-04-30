/** @type {import('tailwindcss').Config} */
// 沿用 index.html 內的 tailwind config（brand 色票、字級、深色模式）
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,html}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FAF5F3',
          100: '#F2E6E2',
          200: '#E5CFC8',
          300: '#D4B0A5',
          400: '#C29185',
          500: '#B0736A',
          600: '#9A6158',
          700: '#805048',
          800: '#653F38',
          900: '#4A2E28',
        },
        morandi: {
          green: '#5E9E72',
          amber: '#C4A97D',
          rose: '#C46B6B',
          blue: '#6889A8',
          purple: '#9B8BAD',
          gray: '#A89E98',
        },
      },
      fontSize: {
        xs: ['13px', { lineHeight: '1.4' }],
        sm: ['15px', { lineHeight: '1.5' }],
        base: ['17px', { lineHeight: '1.6' }],
        lg: ['20px', { lineHeight: '1.5' }],
        xl: ['22px', { lineHeight: '1.4' }],
        '2xl': ['26px', { lineHeight: '1.3' }],
      },
    },
  },
  plugins: [],
};
