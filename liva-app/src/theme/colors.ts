// Resolved theme tokens — matches the CSS variables in the original design.
// Two palettes (dark / light). Accent is a 2-color gradient.

export type ThemeMode = 'dark' | 'light';

export interface ThemeTokens {
  mode: ThemeMode;
  accent1: string;
  accent2: string;
  accentGrad: [string, string];
  buy: string;
  live: string;
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textDim: string;
  radius: number;
}

// LIVA Pulse Market palette. Electric indigo/cyan carries navigation and AI,
// coral is reserved for live activity, mint means a confident purchase, and
// solar yellow calls out time-sensitive deals. The neutral foundation keeps
// those accents energetic without turning every screen into a red wall.
export const ACCENT_DEFAULT: [string, string] = ['#635BFF', '#19C6E6'];

export function tokens(mode: ThemeMode, accent: [string, string] = ACCENT_DEFAULT, radius = 22): ThemeTokens {
  const dark = mode === 'dark';
  return {
    mode,
    accent1: accent[0],
    accent2: accent[1],
    accentGrad: accent,
    buy: '#2DE2A6',
    live: '#FF3D71',
    radius,
    ...(dark
      ? {
          bg: '#07111F',
          surface: '#0E1D2E',
          surface2: '#172B42',
          border: 'rgba(142,168,204,0.17)',
          text: '#F7FAFF',
          textDim: 'rgba(220,232,248,0.64)',
        }
      : {
          bg: '#F4F7FC',
          surface: '#FFFFFF',
          surface2: '#EAF0FA',
          border: 'rgba(29,54,87,0.11)',
          text: '#0B1728',
          textDim: 'rgba(30,52,80,0.62)',
        }),
  };
}

// ── Deterministic gradient seed → 2 colors, used for product/category placeholders.
export function hashHue(str = ''): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

// Returns 2 HSL stops in the violet/cool family for cohesion. RN doesn't support
// OKLCH; HSL is the closest perceptually-uniform-ish substitute.
export function gradientFor(seed: string, opts: { dark?: boolean; vivid?: boolean } = {}): [string, string] {
  const base = hashHue(seed);
  const h1 = base % 360;
  const h2 = (base + 38) % 360;
  const l = opts.dark ? 22 : 60;
  const sat = opts.vivid ? 60 : 45;
  return [`hsl(${h1}, ${sat}%, ${l}%)`, `hsl(${h2}, ${sat}%, ${l - 10}%)`];
}
