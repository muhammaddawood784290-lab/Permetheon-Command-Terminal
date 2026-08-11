/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Background + Surface
        bg: {
          DEFAULT: '#0f172a',
          subtle: '#0b1220',
          surface: '#111a2e',
          elevated: '#162033',
          hover: '#1c2742',
        },
        // Border
        border: {
          DEFAULT: '#1f2a44',
          strong: '#2a3658',
          subtle: '#182238',
        },
        // Text
        text: {
          DEFAULT: '#e6ecf5',
          secondary: '#a6b1c6',
          muted: '#6f7c97',
          disabled: '#4a5675',
          inverse: '#0f172a',
        },
        // Primary brand
        primary: {
          50: '#eef4ff',
          100: '#dde9ff',
          200: '#b8d0ff',
          300: '#8ab1ff',
          400: '#5d8fff',
          500: '#3b6ff4',
          600: '#2a55d6',
          700: '#1f43ac',
          800: '#173684',
          900: '#112860',
        },
        // Semantic
        success: {
          DEFAULT: '#15803d',
          light: '#22c55e',
          soft: 'rgba(34, 197, 94, 0.12)',
        },
        warning: {
          DEFAULT: '#a16207',
          light: '#eab308',
          soft: 'rgba(234, 179, 8, 0.12)',
        },
        danger: {
          DEFAULT: '#b91c1c',
          light: '#ef4444',
          soft: 'rgba(239, 68, 68, 0.12)',
        },
        info: {
          DEFAULT: '#0369a1',
          light: '#0ea5e9',
          soft: 'rgba(14, 165, 233, 0.12)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.625rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0,0,0,0.15)',
        sm: '0 1px 2px 0 rgba(0,0,0,0.2)',
        DEFAULT: '0 1px 3px 0 rgba(0,0,0,0.25), 0 1px 2px 0 rgba(0,0,0,0.15)',
        md: '0 4px 6px -1px rgba(0,0,0,0.25), 0 2px 4px -2px rgba(0,0,0,0.15)',
        lg: '0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -4px rgba(0,0,0,0.15)',
        glow: '0 0 0 1px rgba(91, 143, 244, 0.4)',
      },
      transitionDuration: {
        '250': '250ms',
      },
      spacing: {
        sidebar: '15rem',
        'sidebar-collapsed': '4rem',
        topbar: '3.5rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-slide': {
          '0%': { transform: 'translateY(-6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'slide-up': 'slide-up 200ms ease-out',
        'fade-slide': 'fade-slide 200ms ease-out',
      },
    },
  },
  plugins: [],
};
