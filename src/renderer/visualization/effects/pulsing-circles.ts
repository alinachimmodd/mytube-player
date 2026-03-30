import * as THREE from 'three';
import type { AudioAnalysisData } from '@shared/types/audio';
import { VisualizationEffect } from '../effect-base';

const RING_COUNT = 5;

interface RingState {
  mesh: THREE.Mesh;
  baseRadius: number;
  rotationSpeed: number;
  pulseDecay: number; // current pulse intensity (0-1), decays each frame
}

export class PulsingCirclesEffect extends VisualizationEffect {
  private rings: RingState[] = [];
  private colors = [
    new THREE.Color('#8b5cf6'),
    new THREE.Color('#a78bfa'),
    new THREE.Color('#c084fc'),
    new THREE.Color('#6d28d9'),
    new THREE.Color('#7c3aed'),
  ];

  setup(): void {
    for (let i = 0; i < RING_COUNT; i++) {
      const innerRadius = 0.15 + i * 0.15;
      const outerRadius = innerRadius + 0.04;

      const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
      const material = new THREE.MeshBasicMaterial({
        color: this.colors[i],
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = 0;

      this.scene.add(mesh);

      this.rings.push({
        mesh,
        baseRadius: 1,
        rotationSpeed: 0.2 + i * 0.15 * (i % 2 === 0 ? 1 : -1),
        pulseDecay: 0,
      });
    }
  }

  update(audioData: AudioAnalysisData, deltaTime: number): void {
    const { bands, isBeat } = audioData;

    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];

      // Trigger pulse on beat
      if (isBeat) {
        ring.pulseDecay = 1.0;
      }

      // Decay pulse
      ring.pulseDecay *= 0.92;

      // Outer rings react to bass, inner to mids
      const bandReact =
        i < 2
          ? bands.sub * 0.5 + bands.bass * 0.5
          : i < 4
            ? bands.lowMid * 0.5 + bands.mid * 0.5
            : bands.highMid * 0.5 + bands.high * 0.5;

      // Scale: base + audio reactivity + beat pulse
      const scale = 1.0 + bandReact * 0.4 + ring.pulseDecay * 0.3;
      ring.mesh.scale.set(scale, scale, 1);

      // Rotation
      ring.mesh.rotation.z += ring.rotationSpeed * deltaTime;

      // Opacity: brighter when audio is louder
      const mat = ring.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + bandReact * 0.5 + ring.pulseDecay * 0.2;
    }
  }

  teardown(): void {
    for (const ring of this.rings) {
      this.scene.remove(ring.mesh);
      ring.mesh.geometry.dispose();
      (ring.mesh.material as THREE.Material).dispose();
    }
    this.rings = [];
  }
}
