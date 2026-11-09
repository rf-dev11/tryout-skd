module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1c1c1c',
        frame: '#2e2e2e',
        paper: '#f8f7f4',
        sun: '#ffdb6e',
        lilac: '#d8c0ff',
        sky: '#b6e3ff',
        flame: '#ff5a2f',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
