/**
 * 10-band equalizer using Web Audio API BiquadFilterNodes.
 * Singleton — stored on window to survive HMR.
 *
 * Chain: AudioSource → filters[0..9] → AudioContext.destination
 *
 * IMPORTANT: createMediaElementSource() throws if called twice on the
 * same element, so we store the instance on the window object.
 */

export interface EQBand {
  frequency: number;
  label: string;
  type: BiquadFilterType;
}

export const EQ_BANDS: EQBand[] = [
  { frequency: 32,    label: '32',   type: 'lowshelf' },
  { frequency: 64,    label: '64',   type: 'peaking' },
  { frequency: 125,   label: '125',  type: 'peaking' },
  { frequency: 250,   label: '250',  type: 'peaking' },
  { frequency: 500,   label: '500',  type: 'peaking' },
  { frequency: 1000,  label: '1K',   type: 'peaking' },
  { frequency: 2000,  label: '2K',   type: 'peaking' },
  { frequency: 4000,  label: '4K',   type: 'peaking' },
  { frequency: 8000,  label: '8K',   type: 'peaking' },
  { frequency: 16000, label: '16K',  type: 'highshelf' },
];

declare global {
  interface Window {
    __equalizer?: Equalizer;
  }
}

export class Equalizer {
  private context: AudioContext;
  private source: MediaElementAudioSourceNode;
  private filters: BiquadFilterNode[];
  private _enabled = true;
  private directConnection: boolean = false;

  constructor(audioElement: HTMLAudioElement) {
    this.context = new AudioContext();
    this.source = this.context.createMediaElementSource(audioElement);

    // Create filter chain
    this.filters = EQ_BANDS.map((band) => {
      const filter = this.context.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.value = band.frequency;
      filter.gain.value = 0; // Flat by default
      if (band.type === 'peaking') {
        filter.Q.value = 1.4; // Moderate Q for musical EQ
      }
      return filter;
    });

    // Wire: source → filter[0] → filter[1] → ... → destination
    this.source.connect(this.filters[0]);
    for (let i = 0; i < this.filters.length - 1; i++) {
      this.filters[i].connect(this.filters[i + 1]);
    }
    this.filters[this.filters.length - 1].connect(this.context.destination);
  }

  /** Set gain for a specific band (index 0-9), value in dB (-12 to +12) */
  setGain(bandIndex: number, gainDb: number): void {
    if (bandIndex >= 0 && bandIndex < this.filters.length) {
      this.filters[bandIndex].gain.value = gainDb;
    }
  }

  /** Get gain for a specific band */
  getGain(bandIndex: number): number {
    return this.filters[bandIndex]?.gain.value ?? 0;
  }

  /** Set all band gains at once (array of 10 dB values) */
  setAllGains(gains: number[]): void {
    gains.forEach((gain, i) => this.setGain(i, gain));
  }

  /** Reset all bands to flat (0 dB) */
  reset(): void {
    this.filters.forEach((f) => { f.gain.value = 0; });
  }

  /** Enable/disable EQ — when disabled, bypasses filters */
  setEnabled(enabled: boolean): void {
    if (enabled === this._enabled) return;
    this._enabled = enabled;

    if (enabled) {
      // Reconnect through filters
      this.source.disconnect();
      this.source.connect(this.filters[0]);
      for (let i = 0; i < this.filters.length - 1; i++) {
        this.filters[i].disconnect();
        this.filters[i].connect(this.filters[i + 1]);
      }
      this.filters[this.filters.length - 1].disconnect();
      this.filters[this.filters.length - 1].connect(this.context.destination);
    } else {
      // Bypass: source → destination directly
      this.source.disconnect();
      this.filters.forEach((f) => f.disconnect());
      this.source.connect(this.context.destination);
    }
  }

  get enabled(): boolean {
    return this._enabled;
  }

  /** Resume AudioContext (needed after user gesture in some browsers) */
  resume(): void {
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }
}

/**
 * Get or create the singleton Equalizer instance.
 * Must be called AFTER a user gesture (click) to satisfy autoplay policy.
 */
export function getEqualizer(audioElement: HTMLAudioElement): Equalizer {
  if (!window.__equalizer) {
    window.__equalizer = new Equalizer(audioElement);
  }
  return window.__equalizer;
}
