/** @type {import('tailwindcss').Config} */

const data = {
  content: ['./index.html', './src/**/*.tsx'],
  theme: {
    extend: {},
  },
  // eslint-disable-next-line unicorn/prefer-module
  plugins: [require('@tailwindcss/forms')],
};
export default data;
