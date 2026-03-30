export interface FrequencyBands {
  sub: number; // 20-60 Hz
  bass: number; // 60-250 Hz
  lowMid: number; // 250-500 Hz
  mid: number; // 500-2000 Hz
  highMid: number; // 2000-4000 Hz
  high: number; // 4000-20000 Hz
}

export interface AudioAnalysisData {
  /** Raw FFT frequency magnitudes (0-255, Uint8Array) */
  frequencyData: Uint8Array;
  /** Raw time-domain waveform (0-255, Uint8Array) */
  timeDomainData: Uint8Array;
  /** Pre-computed frequency band averages (each 0.0-1.0) */
  bands: FrequencyBands;
  /** Overall energy level (0.0-1.0) */
  energy: number;
  /** Whether a beat was detected this frame */
  isBeat: boolean;
  /** Number of FFT bins */
  binCount: number;
}
