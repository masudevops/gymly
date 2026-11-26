// Gymly design tokens. Single source of truth for Tailwind classes (tailwind.config.js)
// and JS-side styling (charts, icons, navigation theme). Dark-first.

const colors = {
  // Surfaces, darkest to lightest
  ink: '#0B0B0F', // app background
  surface: '#14141B', // cards
  raised: '#1C1C25', // inputs, pressed cards, sheets
  line: '#2A2A36', // borders, dividers

  // Text
  fg: '#F4F4F6', // primary text
  muted: '#9C9CAB', // secondary text
  faint: '#5F5F6E', // placeholders, disabled

  // Brand
  volt: '#D4FF3A', // primary accent: CTAs, active states, PRs
  'volt-dim': '#A8CC2E', // pressed accent
  iris: '#8B7CFF', // secondary accent: charts, programs

  // Feedback
  success: '#3DDC97',
  warning: '#FFB547',
  danger: '#FF5C6C',
};

module.exports = { colors };
