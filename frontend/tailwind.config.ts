import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff1f1f',
          50: '#fff0f0',
          100: '#ffdddd',
          200: '#ffc0c0',
          300: '#ff9494',
          400: '#ff5757',
          500: '#ff1f1f',
          600: '#ed0a0a',
          700: '#c80a0a',
          800: '#a50f0f',
          900: '#881414',
          950: '#4a0404',
        },
        surface: {
          DEFAULT: '#090909',
          50: '#1a1a1a',
          100: '#151515',
          200: '#111111',
          300: '#0e0e0e',
          400: '#0c0c0c',
          500: '#0a0a0a',
          600: '#090909',
          700: '#080808',
          800: '#060606',
          900: '#040404',
        },
        card: {
          DEFAULT: '#151515',
          hover: '#1f1f1f',
          border: '#252525',
        },
        accent: {
          gold: '#ffd700',
          silver: '#c0c0c0',
          bronze: '#cd7f32',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse at center, rgba(255,31,31,0.15) 0%, transparent 70%)',
        'card-glow': 'radial-gradient(ellipse at top right, rgba(255,31,31,0.08) 0%, transparent 60%)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'count-up': 'count-up 2s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'glow-red': '0 0 20px rgba(255,31,31,0.3)',
        'glow-red-lg': '0 0 40px rgba(255,31,31,0.25)',
        'card': '0 0 0 1px rgba(255,255,255,0.05)',
        'card-hover': '0 0 0 1px rgba(255,31,31,0.3), 0 0 30px rgba(255,31,31,0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
