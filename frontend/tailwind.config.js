/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // zinc-950
        panel: '#18181b',      // zinc-900
        borderLine: '#27272a',  // zinc-800
        brand: {
          light: '#818cf8',    // indigo-400
          DEFAULT: '#6366f1',  // indigo-500
          dark: '#4f46e5',     // indigo-600
        },
        textPrimary: '#fafafa', // zinc-50
        textSecondary: '#a1a1aa', // zinc-400
        textMuted: '#71717a',    // zinc-500
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif'],
      },
      spacing: {
        '2': '2px',
        '4': '4px',
        '6': '6px',
        '8': '8px',
        '10': '10px',
        '12': '12px',
        '14': '14px',
        '16': '16px',
        '18': '18px',   // ADD - used everywhere for icon sizing
        '20': '20px',
        '24': '24px',
        '30': '30px',
        '32': '32px',
        '36': '36px',
        '40': '40px',   // ADD - used for min-h-40
        '48': '48px',
        '56': '56px',
        '64': '64px',
        '100': '100px', // ADD - used for h-100 (textareas, skeletons)
        '180': '180px', // ADD - used for h-180 (skeleton cards)
        '400': '400px', // ADD - used for h-400/min-h-400 (board columns)
        '500': '500px', // ADD - used for h-500/min-h-500 (board columns)
      },
      maxWidth: {
        '400': '400px',
        '440': '440px',
        '480': '480px',
      },
      borderRadius: {
        '4': '4px',
        '6': '6px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
      },
      fontSize: {
        '12': '12px',
        '14': '14px',
        '16': '16px',
        '18': '18px',
        '20': '20px',
        '24': '24px',
        '28': '28px',
        '32': '32px',
        '48': '48px',
        '56': '56px',
      },
    },
  },
  plugins: [],
}
