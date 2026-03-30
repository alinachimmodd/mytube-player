import * as THREE from 'three';
import type { EffectId } from '@shared/types/visualization';
import { audioAnalyzer } from '../services/audio/audio-analyzer';
import { createEffect } from './effect-registry';
import { VisualizationEffect } from './effect-base';

/**
 * Three.js visualization engine. Manages the render loop, scene, and active effect.
 * Audio data is read imperatively from audioAnalyzer — never goes through React.
 */
class VisualizationEngine {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene = new THREE.Scene();
  private camera: THREE.OrthographicCamera;
  private clock = new THREE.Clock();
  private animationId: number | null = null;
  private activeEffect: VisualizationEffect | null = null;
  private activeEffectId: EffectId | null = null;
  private width = 1;
  private height = 1;

  constructor() {
    // Orthographic camera — effects work in normalized coords (-1 to 1)
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    this.camera.position.z = 1;
  }

  mount(canvas: HTMLCanvasElement): void {
    if (this.renderer) return;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    this.clock.start();
    this.startLoop();
  }

  unmount(): void {
    this.stopLoop();

    if (this.activeEffect) {
      this.activeEffect.teardown();
      this.activeEffect = null;
      this.activeEffectId = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }

  async setEffect(effectId: EffectId): Promise<void> {
    if (this.activeEffectId === effectId) return;

    // Teardown current
    if (this.activeEffect) {
      this.activeEffect.teardown();
      this.activeEffect = null;
    }

    this.activeEffectId = effectId;

    // Create and setup new effect
    const effect = await createEffect(effectId, this.scene);
    // Check if another effect was set while we were loading
    if (this.activeEffectId !== effectId) return;

    this.activeEffect = effect;
    this.activeEffect.setup();
  }

  resize(width: number, height: number): void {
    if (width === 0 || height === 0) return;
    this.width = width;
    this.height = height;

    const aspect = width / height;
    this.camera.left = -aspect;
    this.camera.right = aspect;
    this.camera.top = 1;
    this.camera.bottom = -1;
    this.camera.updateProjectionMatrix();

    this.renderer?.setSize(width, height);
  }

  getAspect(): number {
    return this.width / this.height;
  }

  private startLoop(): void {
    const tick = () => {
      this.animationId = requestAnimationFrame(tick);

      const deltaTime = this.clock.getDelta();
      const audioData = audioAnalyzer.getAnalysisData();

      if (this.activeEffect) {
        this.activeEffect.update(audioData, deltaTime);
      }

      if (this.renderer) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    this.animationId = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clock.stop();
  }
}

// HMR-safe singleton
declare global {
  interface Window {
    __vizEngine?: VisualizationEngine;
  }
}

if (!window.__vizEngine) {
  window.__vizEngine = new VisualizationEngine();
}

export const visualizationEngine = window.__vizEngine;
