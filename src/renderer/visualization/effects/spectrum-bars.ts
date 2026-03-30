import * as THREE from 'three';
import type { AudioAnalysisData } from '@shared/types/audio';
import { VisualizationEffect } from '../effect-base';

const BAR_COUNT = 64;
const SMOOTHING = 0.15;

export class SpectrumBarsEffect extends VisualizationEffect {
  private mesh: THREE.InstancedMesh | null = null;
  private dummy = new THREE.Object3D();
  private currentHeights = new Float32Array(BAR_COUNT);
  private color1 = new THREE.Color('#8b5cf6'); // purple
  private color2 = new THREE.Color('#06b6d4'); // cyan

  setup(): void {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.85,
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, BAR_COUNT);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Set per-instance colors (gradient from purple to cyan)
    const color = new THREE.Color();
    for (let i = 0; i < BAR_COUNT; i++) {
      const t = i / (BAR_COUNT - 1);
      color.copy(this.color1).lerp(this.color2, t);
      this.mesh.setColorAt(i, color);
    }
    this.mesh.instanceColor!.needsUpdate = true;

    this.scene.add(this.mesh);
    this.currentHeights.fill(0);
  }

  update(audioData: AudioAnalysisData, _deltaTime: number): void {
    if (!this.mesh || audioData.binCount === 0) return;

    // Sample FFT bins evenly for our bar count
    const binStep = Math.floor(audioData.binCount / BAR_COUNT);

    // Get aspect ratio from the engine
    const aspect = (window.__vizEngine as any)?.getAspect?.() || 1.77;
    const totalWidth = aspect * 2; // full width in world units
    const barWidth = (totalWidth / BAR_COUNT) * 0.8;
    const gap = (totalWidth / BAR_COUNT) * 0.2;
    const startX = -aspect + barWidth / 2 + gap / 2;

    for (let i = 0; i < BAR_COUNT; i++) {
      // Get FFT value for this bar (0-1)
      const binIndex = Math.min(i * binStep, audioData.binCount - 1);
      const target = audioData.frequencyData[binIndex] / 255;

      // Smooth transition
      this.currentHeights[i] +=
        (target - this.currentHeights[i]) * SMOOTHING;

      const height = Math.max(this.currentHeights[i] * 1.8, 0.01); // scale up, minimum visible
      const x = startX + i * (barWidth + gap);
      const y = -1 + height / 2; // grow from bottom

      this.dummy.position.set(x, y, 0);
      this.dummy.scale.set(barWidth, height, 0.1);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
  }

  teardown(): void {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
      this.mesh = null;
    }
  }
}
