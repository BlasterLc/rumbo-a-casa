/** Transcrito de tokens.json del design system "Rumbo a Casa" (v1, tema único "Claro"). */

export const color = {
  'surface-base': '#f7f5f1',
  'surface-raised': '#ffffff',
  'surface-sunken': '#efece6',
  'surface-brand': '#1d4ed8',
  'surface-brand-soft': '#e4edf8',
  'surface-accent-soft': '#fbede2',
  'surface-success-soft': '#dff0e6',
  'surface-warning-soft': '#fdf0d9',
  'surface-danger-soft': '#fbe4e2',
  'ink-strong': '#14181f',
  ink: '#2a3039',
  'ink-muted': '#56606e',
  'ink-on-brand': '#ffffff',
  'ink-on-fill': '#ffffff',
  'ink-brand': '#16457e',
  'ink-accent': '#8a3d1e',
  'ink-success': '#14563b',
  'ink-warning': '#7a4700',
  'ink-danger': '#93201f',
  brand: '#2563eb',
  'brand-strong': '#1d4ed8',
  accent: '#b5542e',
  'accent-strong': '#8f3f1f',
  success: '#1c6b4b',
  warning: '#9a5b00',
  danger: '#b02525',
  border: '#dbd6cd',
  'border-strong': '#7c8593',
  'focus-ring': '#2563eb',
  scrim: 'rgba(16, 22, 32, 0.55)',
} as const;

export type TokenColor = keyof typeof color;

export const spacePx = {
  'space-1': 4,
  'space-2': 8,
  'space-3': 12,
  'space-4': 16,
  'space-5': 24,
  'space-6': 32,
  'space-7': 48,
  'space-8': 64,
} as const;

export const radiusPx = {
  'radius-sm': 8,
  'radius-md': 14,
  'radius-lg': 22,
  'radius-pill': 999,
} as const;

export const sizePx = {
  'size-touch': 48,
  'size-control': 56,
  'size-icon': 24,
  'size-mic': 72,
  'size-chip-compacto': 26,
  'size-page': 1120,
  'size-header': 72,
  'size-sidebar': 264,
} as const;

export const sizeMeasure = '36ch';

export const shadow = {
  'shadow-sm': '0 1px 2px rgba(20, 24, 31, 0.08)',
  'shadow-md': '0 4px 14px rgba(20, 24, 31, 0.1)',
  'shadow-lg': '0 12px 32px rgba(20, 24, 31, 0.14)',
} as const;

export const fontFamily = {
  display: '"Bricolage Grotesque", "Figtree", system-ui, sans-serif',
  sans: '"Figtree", "Segoe UI", system-ui, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, monospace',
} as const;

export interface EstiloTexto {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
}

export const type = {
  'display-2xl': { fontFamily: fontFamily.display, fontSize: 'clamp(40px, 4.4vw, 56px)', lineHeight: '1.06', fontWeight: 700, letterSpacing: '-0.02em' },
  'display-xl': { fontFamily: fontFamily.display, fontSize: '40px', lineHeight: '44px', fontWeight: 700, letterSpacing: '-0.02em' },
  'display-l': { fontFamily: fontFamily.display, fontSize: '30px', lineHeight: '36px', fontWeight: 700, letterSpacing: '-0.015em' },
  'display-m': { fontFamily: fontFamily.display, fontSize: '24px', lineHeight: '30px', fontWeight: 600, letterSpacing: '-0.01em' },
  title: { fontFamily: fontFamily.sans, fontSize: '20px', lineHeight: '26px', fontWeight: 600 },
  'body-l': { fontFamily: fontFamily.sans, fontSize: '18px', lineHeight: '28px', fontWeight: 400 },
  body: { fontFamily: fontFamily.sans, fontSize: '16px', lineHeight: '24px', fontWeight: 400 },
  'body-strong': { fontFamily: fontFamily.sans, fontSize: '16px', lineHeight: '24px', fontWeight: 600 },
  caption: { fontFamily: fontFamily.sans, fontSize: '14px', lineHeight: '20px', fontWeight: 400 },
  label: { fontFamily: fontFamily.sans, fontSize: '13px', lineHeight: '16px', fontWeight: 600, letterSpacing: '0.04em' },
  dato: { fontFamily: fontFamily.mono, fontSize: '15px', lineHeight: '22px', fontWeight: 500 },
} satisfies Record<string, EstiloTexto>;
