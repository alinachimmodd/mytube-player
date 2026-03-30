import React from 'react';
import { useVisualizationStore } from '../../stores/visualization-store';
import { EFFECT_META } from '../../visualization/effect-registry';
import type { EffectId } from '@shared/types/visualization';

interface EffectPickerProps {
  onClose: () => void;
}

export function EffectPicker({ onClose }: EffectPickerProps) {
  const { activeEffect, setActiveEffect, enabled, setEnabled, opacity, setOpacity } =
    useVisualizationStore();

  return (
    <div className="absolute bottom-full right-0 mb-2 w-72 bg-surface-800 border border-surface-700 rounded-lg shadow-xl p-4 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-surface-200">Visualizer</h3>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
            enabled
              ? 'bg-accent-600 text-white'
              : 'bg-surface-700 text-surface-400'
          }`}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Effect selection */}
      <div className="space-y-1.5 mb-3">
        {EFFECT_META.map((effect) => (
          <button
            key={effect.id}
            onClick={() => setActiveEffect(effect.id as EffectId)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              activeEffect === effect.id
                ? 'bg-accent-600/20 text-accent-300 border border-accent-600/30'
                : 'text-surface-300 hover:bg-surface-700 border border-transparent'
            }`}
          >
            <div className="font-medium">{effect.name}</div>
            <div className="text-xs text-surface-500 mt-0.5">
              {effect.description}
            </div>
          </button>
        ))}
      </div>

      {/* Opacity slider */}
      <div className="mb-2">
        <label className="text-xs text-surface-400 mb-1 block">
          Opacity: {Math.round(opacity * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(opacity * 100)}
          onChange={(e) => setOpacity(Number(e.target.value) / 100)}
          className="w-full h-1 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-accent-500"
        />
      </div>
    </div>
  );
}
