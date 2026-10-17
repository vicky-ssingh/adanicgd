/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Brand colors are wired to the CSS custom properties defined in
      // src/theme/theme.css so a verified Adani brand-deck swap is one file.
      colors: {
        adani: {
          primary: 'var(--adani-primary)',
          'primary-soft': 'var(--adani-primary-soft)',
          navy: 'var(--adani-navy)',
          'navy-deep': 'var(--adani-navy-deep)',
          accent: 'var(--adani-accent)',
          alert: 'var(--adani-alert)',
          teal: 'var(--adani-teal-cng)',
          violet: 'var(--adani-violet-png)',
          surface: 'var(--adani-surface)',
          'surface-dark': 'var(--adani-surface-dark)',
          ink: 'var(--adani-ink)',
          muted: 'var(--adani-muted)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        panel: '14px',
      },
    },
  },
  plugins: [],
};
