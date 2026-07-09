import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {

      // ─── BRAND COLORS — CHIPO ─────────────────────────────────────────────
      colors: {

        // ── Gold — color de acento principal de la marca ──────────────────
        gold: {
          50:  '#FFFFFF',
          100: '#FAFAFA',
          200: '#F0F0F0',
          300: '#E4E4E4',
          400: '#D9D9D9',   // hover de acento
          500: '#F5F5F5',   // acento principal — blanco marca
          600: '#C4C4C4',
          700: '#9A9A9A',
          800: '#6E6E6E',
          900: '#474747',
          950: '#2B2B2B',
        },

        // ── Obsidian — superficies oscuras (fondo, cards, bordes) ─────────
        obsidian: {
          50:  '#F5F5F5',
          100: '#E8E8E8',
          200: '#D4D4D4',
          300: '#A3A3A3',
          400: '#737373',
          500: '#525252',
          600: '#3A3A3A',
          700: '#2A2A2A',   // border
          800: '#1A1A1A',   // surface-light
          900: '#111111',   // surface
          950: '#0A0A0A',   // background
        },

        // ── Silver — alternativa metálica ─────────────────────────────────
        silver: {
          300: '#E8E8E8',
          400: '#D0D0D0',
          500: '#C0C0C0',   // silver brand
          600: '#A0A0A0',
          700: '#808080',
        },

        // ── Semantic aliases (mapean a los colores de la marca) ───────────
        primary: {
          50:  '#FFFFFF',
          100: '#FAFAFA',
          200: '#F0F0F0',
          300: '#E4E4E4',
          400: '#D9D9D9',
          500: '#F5F5F5',   // ← acento principal blanco
          600: '#C4C4C4',
          700: '#9A9A9A',
          800: '#6E6E6E',
          900: '#474747',
          950: '#3D2D04',
        },

        // ── Estados funcionales ───────────────────────────────────────────
        success: {
          50:  '#F0FDF4',
          100: '#DCFCE7',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          900: '#14532D',
        },
        warning: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          900: '#78350F',
        },
        danger: {
          50:  '#FFF1F2',
          100: '#FFE4E6',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
          900: '#881337',
        },
        info: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          900: '#1E3A8A',
        },

        // ── Neutral — texto y bordes ──────────────────────────────────────
        neutral: {
          50:  '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#B5B5B5',   // texto secundario
          500: '#737373',
          600: '#525252',
          700: '#2A2A2A',   // border
          800: '#1A1A1A',   // surface-light
          900: '#111111',   // surface
          950: '#0A0A0A',   // background
        },
      },

      // ─── TIPOGRAFÍA ────────────────────────────────────────────────────────
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],  // títulos elegantes
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],  // cuerpo
        mono:    ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs:   ['0.75rem',  { lineHeight: '1.4' }],
        sm:   ['0.875rem', { lineHeight: '1.5' }],
        base: ['1rem',     { lineHeight: '1.6' }],
        lg:   ['1.125rem', { lineHeight: '1.5' }],
        xl:   ['1.25rem',  { lineHeight: '1.4' }],
        '2xl':['1.5rem',   { lineHeight: '1.3' }],
        '3xl':['1.875rem', { lineHeight: '1.2' }],
        '4xl':['2.25rem',  { lineHeight: '1.1' }],
        '5xl':['3rem',     { lineHeight: '1.0' }],
        '6xl':['3.75rem',  { lineHeight: '0.95' }],
        '7xl':['4.5rem',   { lineHeight: '0.95' }],
      },

      // ─── ESPACIADO ─────────────────────────────────────────────────────────
      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
        '26':  '6.5rem',
        '30':  '7.5rem',
      },

      // ─── BORDES ────────────────────────────────────────────────────────────
      borderRadius: {
        'xs':  '0.125rem',
        'sm':  '0.25rem',
        DEFAULT:'0.375rem',
        'md':  '0.5rem',
        'lg':  '0.75rem',
        'xl':  '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },

      // ─── SOMBRAS (oscuras, con toques dorados) ────────────────────────────
      boxShadow: {
        'xs':   '0 1px 2px 0 rgb(0 0 0 / 0.4)',
        'sm':   '0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
        DEFAULT:'0 2px 6px -1px rgb(0 0 0 / 0.5)',
        'md':   '0 4px 12px -2px rgb(0 0 0 / 0.6)',
        'lg':   '0 10px 24px -4px rgb(0 0 0 / 0.6)',
        'xl':   '0 20px 40px -8px rgb(0 0 0 / 0.7)',
        '2xl':  '0 32px 64px -12px rgb(0 0 0 / 0.8)',
        // Sombra clara — para elementos premium en hover
        'gold':    '0 4px 20px -2px rgb(255 255 255 / 0.12)',
        'gold-lg': '0 8px 32px -4px rgb(255 255 255 / 0.18)',
        'gold-glow':'0 0 20px rgb(255 255 255 / 0.10)',
        'inner':   'inset 0 2px 4px 0 rgb(0 0 0 / 0.3)',
      },

      // ─── TRANSICIONES ──────────────────────────────────────────────────────
      transitionDuration: {
        DEFAULT: '250ms',
        '75':  '75ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '500': '500ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
        'in':  'cubic-bezier(0.4, 0, 1, 1)',
      },

      // ─── DIMENSIONES DEL LAYOUT ────────────────────────────────────────────
      width: {
        'sidebar':           '240px',
        'sidebar-collapsed': '60px',
      },
      height: {
        'navbar': '64px',
      },
      minHeight: {
        'content': 'calc(100vh - 64px)',
      },

      // ─── ANIMACIONES ───────────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to:   { opacity: '0' },
        },
        'slide-up': {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-8px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },
        'shimmer': {
          from: { backgroundPosition: '-400px 0' },
          to:   { backgroundPosition: '400px 0' },
        },
        'spin-smooth': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'gold-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(255 255 255 / 0)' },
          '50%':      { boxShadow: '0 0 0 6px rgb(255 255 255 / 0.10)' },
        },
      },
      animation: {
        'fade-in':       'fade-in 200ms ease-out',
        'fade-out':      'fade-out 150ms ease-in',
        'slide-up':      'slide-up 200ms cubic-bezier(0,0,0.2,1)',
        'slide-down':    'slide-down 200ms cubic-bezier(0,0,0.2,1)',
        'slide-in-left': 'slide-in-left 250ms cubic-bezier(0,0,0.2,1)',
        'slide-in-right':'slide-in-right 250ms cubic-bezier(0,0,0.2,1)',
        'scale-in':      'scale-in 200ms cubic-bezier(0,0,0.2,1)',
        'shimmer':       'shimmer 1.8s infinite linear',
        'spin-smooth':   'spin-smooth 0.8s linear infinite',
        'gold-pulse':    'gold-pulse 2s ease-in-out infinite',
      },

      // ─── Z-INDEX ───────────────────────────────────────────────────────────
      zIndex: {
        'sidebar':  '40',
        'navbar':   '30',
        'drawer':   '50',
        'modal':    '60',
        'toast':    '70',
        'tooltip':  '80',
        'overlay':  '45',
      },

      // ─── GRIDS ─────────────────────────────────────────────────────────────
      gridTemplateColumns: {
        'admin':             '240px 1fr',
        'admin-collapsed':   '60px 1fr',
        'store-sidebar':     '280px 1fr',
        'product-detail':    '1fr 420px',
        'checkout':          '1fr 380px',
        'kpi-4':             'repeat(4, 1fr)',
        'kpi-3':             'repeat(3, 1fr)',
        'kpi-2':             'repeat(2, 1fr)',
        'products-4':        'repeat(4, minmax(0, 1fr))',
        'products-3':        'repeat(3, minmax(0, 1fr))',
        'products-2':        'repeat(2, minmax(0, 1fr))',
      },

      // ─── BACKDROP ──────────────────────────────────────────────────────────
      backdropBlur: {
        'xs': '4px',
        'sm': '8px',
        DEFAULT: '12px',
        'md': '16px',
      },
    },
  },
  plugins: [],
}

export default config
