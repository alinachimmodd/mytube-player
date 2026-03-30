import * as THREE from 'three';
import type { AudioAnalysisData } from '@shared/types/audio';
import { VisualizationEffect } from '../effect-base';

const PARTICLE_COUNT = 2500;

export class ParticleFieldEffect extends VisualizationEffect {
  private points: THREE.Points | null = null;
  private basePositions: Float32Array = new Float32Array(0);
  private velocities: Float32Array = new Float32Array(0);
  private burstDecay = 0;

  setup(): void {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    this.basePositions = new Float32Array(PARTICLE_COUNT * 3);
    this.velocities = new Float32Array(PARTICLE_COUNT * 3);

    const color1 = new THREE.Color('#8b5cf6');
    const color2 = new THREE.Color('#06b6d4');
    const tmpColor = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      // Random position in a disc
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 1.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = 0;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      this.basePositions[i3] = x;
      this.basePositions[i3 + 1] = y;
      this.basePositions[i3 + 2] = z;

      this.velocities[i3] = 0;
      this.velocities[i3 + 1] = 0;
      this.velocities[i3 + 2] = 0;

      // Random color between purple and cyan
      const t = Math.random();
      tmpColor.copy(color1).lerp(color2, t);
      colors[i3] = tmpColor.r;
      colors[i3 + 1] = tmpColor.g;
      colors[i3 + 2] = tmpColor.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.015,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  update(audioData: AudioAnalysisData, deltaTime: number): void {
    if (!this.points) return;

    const { bands, energy, isBeat } = audioData;
    const positions = this.points.geometry.attributes.position
      .array as Float32Array;

    // Beat burst
    if (isBeat) {
      this.burstDecay = 1.0;
      // Apply radial burst velocity
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const dx = positions[i3];
        const dy = positions[i3 + 1];
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        this.velocities[i3] += (dx / dist) * 0.3;
        this.velocities[i3 + 1] += (dy / dist) * 0.3;
      }
    }
    this.burstDecay *= 0.95;

    const bassDisplace = bands.bass * 0.15;
    const highJitter = bands.high * 0.02;
    const drift = energy * 0.3;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Apply velocity with damping
      this.velocities[i3] *= 0.92;
      this.velocities[i3 + 1] *= 0.92;

      // Displace from base position
      const baseX = this.basePositions[i3];
      const baseY = this.basePositions[i3 + 1];

      // Bass: vertical displacement
      const yOffset = bassDisplace * Math.sin(baseX * 3 + performance.now() * 0.001);
      // High: random jitter
      const jitterX = (Math.random() - 0.5) * highJitter;
      const jitterY = (Math.random() - 0.5) * highJitter;

      // Pull back toward base position
      const pullX = (baseX - positions[i3]) * 0.02;
      const pullY = (baseY - positions[i3 + 1]) * 0.02;

      positions[i3] += this.velocities[i3] * deltaTime + pullX + jitterX;
      positions[i3 + 1] +=
        this.velocities[i3 + 1] * deltaTime + pullY + jitterY + yOffset * deltaTime;
    }

    this.points.geometry.attributes.position.needsUpdate = true;

    // Rotate slowly based on energy
    this.points.rotation.z += drift * deltaTime * 0.1;

    // Particle size reacts to energy
    const mat = this.points.material as THREE.PointsMaterial;
    mat.size = 0.01 + energy * 0.02 + this.burstDecay * 0.01;
  }

  teardown(): void {
    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
      (this.points.material as THREE.Material).dispose();
      this.points = null;
    }
    this.basePositions = new Float32Array(0);
    this.velocities = new Float32Array(0);
  }
}
