/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/client/**/*.{ts,tsx}', './src/client/index.html'],
  theme: {
    extend: {
      colors: {
        dashboard: {
          bg: '#0f1117',
          card: '#1a1d27',
          'card-hover': '#222639',
          border: '#2a2e3d',
          'text-primary': '#e2e8f0',
          'text-muted': '#94a3b8',
        },
        toyota: '#dc2626',
        infiniti: '#6366f1',
        success: '#22c55e',
        danger: '#ef4444',
        warning: '#eab308',
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (utils: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.scrollbar-hide::-webkit-scrollbar': {
          display: 'none',
        },
      });
    },
  ],
};
