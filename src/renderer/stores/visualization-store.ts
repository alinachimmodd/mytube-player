import { create } from 'zustand';
import type { EffectId } from '@shared/types/visualization';

interface VisualizationStore {
  enabled: boolean;
  activeEffect: EffectId;
  opacity: number;
  intensity: number;
  paletteId: string;

  setEnabled: (enabled: boolean) => void;
  setActiveEffect: (effect: EffectId) => void;
  setOpacity: (opacity: number) => void;
  setIntensity: (intensity: number) => void;
  setPaletteId: (id: string) => void;
}

export const useVisualizationStore = create<VisualizationStore>((set) => ({
  enabled: true,
  activeEffect: 'spectrum-bars',
  opacity: 0.6,
  intensity: 0.8,
  paletteId: 'violet',

  setEnabled: (enabled) => set({ enabled }),
  setActiveEffect: (activeEffect) => set({ activeEffect }),
  setOpacity: (opacity) => set({ opacity }),
  setIntensity: (intensity) => set({ intensity }),
  setPaletteId: (paletteId) => set({ paletteId }),
}));
