import type { AudioAnalysisData, FrequencyBands } from '@shared/types/audio';

const FFT_SIZE = 2048;
const BEAT_HISTORY_SIZE = 43; // ~700ms at 60fps
const BEAT_THRESHOLD = 1.4;
const BEAT_COOLDOWN_FRAMES = 9; // ~150ms at 60fps

/**
 * Connects to an HTMLAudioElement via Web Audio API and provides
 * real-time FFT analysis, frequency bands, and beat detection.
 *
 * Singleton — stored on window.__audioAnalyzer for HMR survival.
 */
class AudioAnalyzer {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private connectedElement: HTMLAudioElement | null = null;

  // Pre-allocated buffers (avoid GC at 60fps)
  private frequencyData: Uint8Array = new Uint8Array(0);
  private timeDomainData: Uint8Array = new Uint8Array(0);

  // Beat detection state
  private energyHistory: number[] = [];
  private framesSinceLastBeat = BEAT_COOLDOWN_FRAMES;

  // Band frequency ranges in Hz
  private static readonly BANDS: Array<[keyof FrequencyBands, number, number]> = [
    ['sub', 20, 60],
    ['bass', 60, 250],
    ['lowMid', 250, 500],
    ['mid', 500, 2000],
    ['highMid', 2000, 4000],
    ['high', 4000, 20000],
  ];

  /**
   * Connect to an audio element. Safe to call multiple times —
   * reuses the existing source node if the same element is passed.
   */
  async connect(audioElement: HTMLAudioElement): Promise<void> {
    // Already connected to this element
    if (this.connectedElement === audioElement && this.context) {
      await this.context.resume();
      return;
    }

    // Create AudioContext on first connect (satisfies autoplay policy)
    if (!this.context) {
      this.context = new AudioContext();
    }
    await this.context.resume();

    // Create AnalyserNode
    if (!this.analyser) {
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = FFT_SIZE;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.connect(this.context.destination);

      // Allocate buffers
      const binCount = this.analyser.frequencyBinCount;
      this.frequencyData = new Uint8Array(binCount);
      this.timeDomainData = new Uint8Array(binCount);
    }

    // Create MediaElementSourceNode (throws if called twice on same element)
    if (this.connectedElement !== audioElement) {
      // Disconnect old source if any
      if (this.sourceNode) {
        this.sourceNode.disconnect();
      }

      this.sourceNode = this.context.createMediaElementSource(audioElement);
      this.sourceNode.connect(this.analyser);
      this.connectedElement = audioElement;
    }
  }

  /**
   * Get current audio analysis data. Call this every frame in the render loop.
   * Returns zeroed data if not connected.
   */
  getAnalysisData(): AudioAnalysisData {
    const binCount = this.analyser?.frequencyBinCount || 0;

    if (!this.analyser || !this.context || this.context.state !== 'running') {
      return this.emptyData(binCount);
    }

    // Read FFT data into pre-allocated buffers
    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeDomainData);

    // Compute frequency bands
    const sampleRate = this.context.sampleRate;
    const bands = this.computeBands(sampleRate, binCount);

    // Compute overall energy (average of all bands)
    const energy =
      (bands.sub + bands.bass + bands.lowMid + bands.mid + bands.highMid + bands.high) / 6;

    // Beat detection
    const isBeat = this.detectBeat(energy);

    return {
      frequencyData: this.frequencyData,
      timeDomainData: this.timeDomainData,
      bands,
      energy,
      isBeat,
      binCount,
    };
  }

  private computeBands(sampleRate: number, binCount: number): FrequencyBands {
    const bands: FrequencyBands = {
      sub: 0,
      bass: 0,
      lowMid: 0,
      mid: 0,
      highMid: 0,
      high: 0,
    };

    for (const [name, minHz, maxHz] of AudioAnalyzer.BANDS) {
      const minBin = Math.round((minHz * FFT_SIZE) / sampleRate);
      const maxBin = Math.min(
        Math.round((maxHz * FFT_SIZE) / sampleRate),
        binCount - 1
      );

      let sum = 0;
      let count = 0;
      for (let i = minBin; i <= maxBin; i++) {
        sum += this.frequencyData[i];
        count++;
      }

      bands[name] = count > 0 ? sum / count / 255 : 0;
    }

    return bands;
  }

  private detectBeat(energy: number): boolean {
    this.energyHistory.push(energy);
    if (this.energyHistory.length > BEAT_HISTORY_SIZE) {
      this.energyHistory.shift();
    }
    this.framesSinceLastBeat++;

    if (this.energyHistory.length < 10) return false;

    const mean =
      this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;

    if (
      energy > mean * BEAT_THRESHOLD &&
      this.framesSinceLastBeat >= BEAT_COOLDOWN_FRAMES
    ) {
      this.framesSinceLastBeat = 0;
      return true;
    }

    return false;
  }

  private emptyData(binCount: number): AudioAnalysisData {
    return {
      frequencyData: this.frequencyData,
      timeDomainData: this.timeDomainData,
      bands: { sub: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0, high: 0 },
      energy: 0,
      isBeat: false,
      binCount,
    };
  }

  disconnect(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.connectedElement = null;
  }
}

// HMR-safe singleton
declare global {
  interface Window {
    __audioAnalyzer?: AudioAnalyzer;
  }
}

if (!window.__audioAnalyzer) {
  window.__audioAnalyzer = new AudioAnalyzer();
}

export const audioAnalyzer = window.__audioAnalyzer;
