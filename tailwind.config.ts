/**
 * @team     ops
 * @owner    ops-lead
 * @public   no
 * @updated  2026-09-08
 *
 * Tokens mirror the CSS variables declared in src/styles.css. Nobody hardcodes a hex.
 */
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        'panel-2': 'var(--panel-2)',
        line: 'var(--line)',
        'line-hot': 'var(--line-hot)',
        text: 'var(--text)',
        'text-dim': 'var(--text-dim)',
        accent: 'var(--accent)',
        // Team colours are namespaced so they do not shadow Tailwind's own
        // `red`/`blue` palettes.
        'team-red': 'var(--team-red)',
        'team-blue': 'var(--team-blue)',
        'team-alerts': 'var(--team-alerts)',
        'team-logistics': 'var(--team-logistics)',
        'team-loop': 'var(--team-loop)',
      },
      fontFamily: {
        sans: ['Heebo', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '3px',
      },
    },
  },
  plugins: [],
} satisfies Config;
