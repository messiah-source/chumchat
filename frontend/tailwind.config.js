/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          'bg-deep':   '#080f1a',
          'bg-outer':  '#0B1929',
          'bg-inner':  '#142940',
          'panel':     '#0d1b2a',
          'panel-2':   '#162030',
          'panel-3':   '#1a2a3a',
          'border':    '#1e3a5f',
          'border-2':  '#243f5c',
          'cyan':      '#00d4ff',
          'cyan-dim':  '#4fc3f7',
          'red':       '#FF384F',
          'orange':    '#ff8c42',
          'green':     '#39ff14',
          'text':      '#e6e6e6',
          'text-dim':  '#7a9bb5',
          'text-muted':'#4a6a8a',
        },
        light: {
          'bg-outer':  '#2d4a6a',
          'bg-inner':  '#3a5580',
          'panel':     '#e8edf2',
          'panel-2':   '#f0f4f8',
          'panel-3':   '#dce5ef',
          'border':    '#a0b4c8',
          'text':      '#1a2a3a',
          'text-dim':  '#3a5a7a',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'Consolas', 'monospace'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'cyber': '0 0 20px rgba(0,212,255,0.15), 0 0 40px rgba(0,212,255,0.05)',
        'cyber-red': '0 0 20px rgba(255,56,79,0.3)',
        'cyber-inner': 'inset 0 0 30px rgba(0,0,0,0.5)',
        'glow-cyan': '0 0 15px rgba(0,212,255,0.6)',
        'glow-red': '0 0 15px rgba(255,56,79,0.6)',
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
};
