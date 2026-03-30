import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EQPreset {
  name: string;
  gains: number[]; // 10 values in dB
}

export const EQ_PRESETS: EQPreset[] = [
  { name: 'Flat',        gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'Bass Boost',  gains: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
  { name: 'Treble Boost', gains: [0, 0, 0, 0, 0, 0, 2, 4, 5, 6] },
  { name: 'Vocal',       gains: [-2, -1, 0, 2, 4, 4, 2, 0, -1, -2] },
  { name: 'Rock',        gains: [4, 3, 1, 0, -1, -1, 0, 2, 3, 4] },
  { name: 'Pop',         gains: [-1, 1, 3, 4, 3, 0, -1, -1, 1, 2] },
  { name: 'Jazz',        gains: [3, 2, 0, 1, -1, -1, 0, 1, 2, 3] },
  { name: 'Electronic',  gains: [4, 3, 1, 0, -2, 0, 1, 3, 4, 3] },
  { name: 'Classical',   gains: [3, 2, 1, 0, 0, 0, 0, 1, 2, 3] },
  { name: 'Loudness',    gains: [4, 3, 0, 0, -2, 0, -1, 0, 3, 4] },
];

interface EQStore {
  enabled: boolean;
  gains: number[];       // 10 band gains in dB (-12 to +12)
  activePreset: string;  // preset name or 'Custom'

  setEnabled: (enabled: boolean) => void;
  setGain: (index: number, gain: number) => void;
  setAllGains: (gains: number[], presetName?: string) => void;
  applyPreset: (preset: EQPreset) => void;
  reset: () => void;
}

export const useEQStore = create<EQStore>()(
  persist(
    (set) => ({
      enabled: true,
      gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      activePreset: 'Flat',

      setEnabled: (enabled) => set({ enabled }),

      setGain: (index, gain) =>
        set((s) => {
          const newGains = [...s.gains];
          newGains[index] = Math.max(-12, Math.min(12, gain));
          return { gains: newGains, activePreset: 'Custom' };
        }),

      setAllGains: (gains, presetName) =>
        set({ gains: [...gains], activePreset: presetName || 'Custom' }),

      applyPreset: (preset) =>
        set({ gains: [...preset.gains], activePreset: preset.name }),

      reset: () =>
        set({ gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], activePreset: 'Flat' }),
    }),
    { name: 'mytube-eq' }
  )
);
