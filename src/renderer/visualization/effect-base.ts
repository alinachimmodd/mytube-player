import * as THREE from 'three';
import type { AudioAnalysisData } from '@shared/types/audio';
import type { ColorPalette } from '@shared/types/visualization';

export abstract class VisualizationEffect {
  constructor(protected scene: THREE.Scene) {}

  /** Create meshes/materials and add to scene */
  abstract setup(): void;

  /** Called every frame with current audio data */
  abstract update(audioData: AudioAnalysisData, deltaTime: number): void;

  /** Remove all objects from scene and dispose resources */
  abstract teardown(): void;

  /** Called when the color palette changes */
  onPaletteChange?(palette: ColorPalette): void;
}
