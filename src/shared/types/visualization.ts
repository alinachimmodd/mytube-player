export type EffectId = 'spectrum-bars' | 'pulsing-circles' | 'particle-field';

export interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export interface VisualizationConfig {
  enabled: boolean;
  activeEffect: EffectId;
  paletteId: string;
  opacity: number; // 0.0-1.0
  intensity: number; // 0.0-1.0
}

export const DEFAULT_PALETTES: ColorPalette[] = [
  {
    id: 'violet',
    name: 'Violet',
    primary: '#8b5cf6',
    secondary: '#6d28d9',
    accent: '#c084fc',
    background: '#0f0a1a',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    primary: '#06b6d4',
    secondary: '#0891b2',
    accent: '#22d3ee',
    background: '#0a1628',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    primary: '#f97316',
    secondary: '#ea580c',
    accent: '#fb923c',
    background: '#1a0a05',
  },
  {
    id: 'neon',
    name: 'Neon',
    primary: '#22c55e',
    secondary: '#16a34a',
    accent: '#4ade80',
    background: '#0a1a0f',
  },
];
