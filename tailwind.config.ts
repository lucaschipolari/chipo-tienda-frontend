import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ─── BRAND COLORS ───────────────────────────────────────────────
      // Los colores corporativos se definen aquí cuando el cliente los provea.
      // La paleta semántica a continuación usa slots mapeados a estos tokens.
      colors: {
        // Primary — acción principal, CTAs, links
        primary: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',  // ← color base (swap por brand color)
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Secondary — acciones secundarias
        secondary: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Accent — highlights especiales
        accent: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        // Estados semánticos
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        danger: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        info: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Neutral — textos, bordes, fondos
        neutral: {
          50:  '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },

      // ─── TIPOGRAFÍA ────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs:   ['0.75rem',  { lineHeight: '1.4', letterSpacing: '0.01em' }],
        sm:   ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        base: ['1rem',     { lineHeight: '1.6' }],
        lg:   ['1.125rem', { lineHeight: '1.5' }],
        xl:   ['1.25rem',  { lineHeight: '1.4' }],
        '2xl':['1.5rem',   { lineHeight: '1.3' }],
        '3xl':['1.875rem', { lineHeight: '1.2' }],
        '4xl':['2.25rem',  { lineHeight: '1.1' }],
        '5xl':['3rem',     { lineHeight: '1.0' }],
      },

      // ─── ESPACIADO ─────────────────────────────────────────────────
      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
        '26':  '6.5rem',
        '30':  '7.5rem',
      },

      // ─── BORDES ────────────────────────────────────────────────────
      borderRadius: {
        'xs': '0.125rem',
        'sm': '0.25rem',
        DEFAULT: '0.375rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl':'1rem',
        '3xl':'1.5rem',
      },

      // ─── SOMBRAS ───────────────────────────────────────────────────
      boxShadow: {
        'xs':  '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'sm':  '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        DEFAULT:'0 2px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        'md':  '0 4px 8px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'lg':  '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'xl':  '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.12)',
        'inner':'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      },

      // ─── TRANSICIONES ──────────────────────────────────────────────
      transitionDuration: {
        DEFAULT: '150ms',
        '75':  '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // ─── DIMENSIONES DEL LAYOUT ────────────────────────────────────
      width: {
        'sidebar':          '240px',
        'sidebar-collapsed':'60px',
      },
      height: {
        'navbar': '60px',
      },
      minHeight: {
        'content': 'calc(100vh - 60px)',
      },

      // ─── ANIMACIONES ───────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-left': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-up': {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        'spin-slow': {
          'from': { transform: 'rotate(0deg)' },
          'to':   { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in':       'fade-in 150ms ease-in-out',
        'slide-in-left': 'slide-in-left 200ms ease-out',
        'slide-in-right':'slide-in-right 200ms ease-out',
        'slide-in-up':   'slide-in-up 150ms ease-out',
        'pulse-soft':    'pulse-soft 2s ease-in-out infinite',
        'spin-slow':     'spin-slow 1.5s linear infinite',
      },

      // ─── Z-INDEX ───────────────────────────────────────────────────
      zIndex: {
        'sidebar':  '40',
        'navbar':   '30',
        'drawer':   '50',
        'modal':    '60',
        'toast':    '70',
        'tooltip':  '80',
        'overlay':  '45',
      },

      // ─── GRIDS ─────────────────────────────────────────────────────
      gridTemplateColumns: {
        'admin': '240px 1fr',
        'admin-collapsed': '60px 1fr',
        'store-sidebar': '280px 1fr',
        'product-detail': '1fr 420px',
        'checkout': '1fr 380px',
        'kpi-4': 'repeat(4, 1fr)',
        'kpi-2': 'repeat(2, 1fr)',
      },
    },
  },
  plugins: [],
}

export default config
