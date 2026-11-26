/** @type {import('tailwindcss').Config} */
const { colors } = require('./src/theme/tokens');

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // The app is dark-only (app.json userInterfaceStyle: "dark"). With the default 'media' mode,
  // NativeWind's web runtime throws when the color scheme is set programmatically.
  darkMode: 'class',
  theme: {
    extend: {
      // Brand palette lives in src/theme/tokens.js so JS (charts, icons) and classes share one source.
      colors,
      fontFamily: {
        sans: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
        display: ['SpaceGrotesk_700Bold'],
        'display-medium': ['SpaceGrotesk_500Medium'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '28px',
      },
    },
  },
  plugins: [],
};
