import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Fintech Theme Tokens
        fintech: {
          bg: 'var(--bg-main)',
          workspace: 'var(--bg-workspace)',
          card: 'var(--bg-card)',
          'card-subtle': 'var(--bg-card-subtle)',
          border: 'var(--border-color)',
          text: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        lime: {
          primary: '#A4E763',
          bright: '#B7F477',
          pale: '#F1F9E9',
        },
        forest: {
          primary: '#073B2F',
          dark: '#0B4A3A',
          muted: '#14251F',
        },
        mint: {
          soft: '#E8F7DB',
          500: '#27834A',
        },
        status: {
          positive: '#27834A',
          'positive-bg': '#EAF7E8',
          warning: '#C28A24',
          'warning-bg': '#FFF4D9',
          negative: '#D94B4B',
          'negative-bg': '#FDECEC',
          info: '#477C73',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'card-sm': '12px',
        'card-md': '18px',
        'card-lg': '24px',
        'card-xl': '32px',
      },
      boxShadow: {
        'card-soft': '0 2px 10px rgba(20, 37, 31, 0.04), 0 1px 3px rgba(20, 37, 31, 0.02)',
        'card-hover': '0 10px 25px -5px rgba(20, 37, 31, 0.08), 0 8px 10px -6px rgba(20, 37, 31, 0.03)',
        'lime-glow': '0 4px 14px 0 rgba(164, 231, 99, 0.35)',
        'forest-glow': '0 4px 14px 0 rgba(7, 59, 47, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
