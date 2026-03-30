import * as THREE from 'three';
import type { EffectId } from '@shared/types/visualization';
import { VisualizationEffect } from './effect-base';

export interface EffectMeta {
  id: EffectId;
  name: string;
  description: string;
}

export const EFFECT_META: EffectMeta[] = [
  {
    id: 'spectrum-bars',
    name: 'Spectrum Bars',
    description: 'Audio frequency bars that pulse with the music',
  },
  {
    id: 'pulsing-circles',
    name: 'Pulsing Circles',
    description: 'Concentric rings that expand on bass hits',
  },
  {
    id: 'particle-field',
    name: 'Particle Field',
    description: 'Floating particles driven by audio energy',
  },
];

export async function createEffect(
  id: EffectId,
  scene: THREE.Scene
): Promise<VisualizationEffect> {
  switch (id) {
    case 'spectrum-bars': {
      const { SpectrumBarsEffect } = await import('./effects/spectrum-bars');
      return new SpectrumBarsEffect(scene);
    }
    case 'pulsing-circles': {
      const { PulsingCirclesEffect } = await import('./effects/pulsing-circles');
      return new PulsingCirclesEffect(scene);
    }
    case 'particle-field': {
      const { ParticleFieldEffect } = await import('./effects/particle-field');
      return new ParticleFieldEffect(scene);
    }
  }
}
