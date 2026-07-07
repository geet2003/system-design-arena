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
        canvas: {
          bg: '#0f1117',
          panel: '#1a1d27',
          border: '#2d3148',
        },
        node: {
          client: '#3b82f6',
          gateway: '#8b5cf6',
          loadbalancer: '#f59e0b',
          service: '#10b981',
          cache: '#ef4444',
          database: '#6366f1',
          queue: '#f97316',
          cdn: '#06b6d4',
          storage: '#84cc16',
          auth: '#ec4899',
          search: '#14b8a6',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
