import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS v4 configuration.
 *
 * Notes:
 * - Uses App Router (app/) and src/ for class scanning.
 * - Design tokens are implemented via CSS variables in app/globals.css.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
          xl: '2.5rem',
        },
      },
      borderRadius: {
        // Backed by CSS vars (see globals.css)
        DEFAULT: 'var(--radius)',
        lg: 'calc(var(--radius) + 2px)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      keyframes: {
        // Backed by framer-friendly tokens; keep minimal.
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(6px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn var(--anim-fast) ease-out both',
        slideUp: 'slideUp var(--anim-fast) ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;

