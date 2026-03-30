import React, { useCallback, useRef } from 'react';
import { useEQStore, EQ_PRESETS } from '../../stores/eq-store';
import { EQ_BANDS } from '../../services/equalizer';

interface EQPanelProps {
  onClose: () => void;
}

export function EQPanel({ onClose }: EQPanelProps) {
  const { enabled, gains, activePreset, setEnabled, setGain, applyPreset, reset } = useEQStore();

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      <div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-surface-800 border border-surface-700 rounded-xl shadow-2xl p-5 w-[520px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white">Equalizer</h3>
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
          <div className="flex items-center gap-2">
            <select
              value={activePreset}
              onChange={(e) => {
                const preset = EQ_PRESETS.find((p) => p.name === e.target.value);
                if (preset) applyPreset(preset);
              }}
              className="bg-surface-900 border border-surface-600 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-accent-500"
            >
              {EQ_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
              {activePreset === 'Custom' && (
                <option value="Custom">Custom</option>
              )}
            </select>
            <button
              onClick={reset}
              className="text-xs text-surface-400 hover:text-white transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* dB scale + Sliders */}
        <div className="flex items-end gap-1">
          {/* dB labels */}
          <div className="flex flex-col justify-between h-[160px] pr-1 text-[9px] text-surface-500 shrink-0">
            <span>+12</span>
            <span>+6</span>
            <span className="text-surface-400">0</span>
            <span>-6</span>
            <span>-12</span>
          </div>

          {/* Band sliders */}
          {EQ_BANDS.map((band, i) => (
            <EQSlider
              key={band.frequency}
              label={band.label}
              value={gains[i]}
              disabled={!enabled}
              onChange={(val) => setGain(i, val)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface EQSliderProps {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}

function EQSlider({ label, value, disabled, onChange }: EQSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const getValueFromY = useCallback((clientY: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    // Top = +12, bottom = -12
    const ratio = (clientY - rect.top) / rect.height;
    const clamped = Math.max(0, Math.min(1, ratio));
    return Math.round((1 - clamped) * 24 - 12); // -12 to +12
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    onChange(getValueFromY(e.clientY));

    const handleMove = (e: MouseEvent) => {
      onChange(getValueFromY(e.clientY));
    };
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  // Position: 0dB is center (50%), +12 is top (0%), -12 is bottom (100%)
  const thumbPercent = ((12 - value) / 24) * 100;
  // Fill from center
  const fillTop = Math.min(50, thumbPercent);
  const fillHeight = Math.abs(thumbPercent - 50);

  return (
    <div className={`flex flex-col items-center flex-1 ${disabled ? 'opacity-40' : ''}`}>
      {/* Value display */}
      <span className="text-[9px] text-surface-400 mb-1 tabular-nums h-3">
        {value > 0 ? `+${value}` : value}
      </span>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative w-5 h-[160px] cursor-pointer group"
        onMouseDown={handleMouseDown}
      >
        {/* Background track */}
        <div className="absolute left-1/2 -translate-x-1/2 w-1 h-full bg-surface-700 rounded-full" />

        {/* Center line (0 dB) */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-surface-500" />

        {/* Fill bar */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-1 bg-accent-500 rounded-full"
          style={{ top: `${fillTop}%`, height: `${fillHeight}%` }}
        />

        {/* Thumb */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-3.5 h-2 bg-white rounded-sm shadow transition-colors group-hover:bg-accent-300"
          style={{ top: `${thumbPercent}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>

      {/* Frequency label */}
      <span className="text-[9px] text-surface-500 mt-1">{label}</span>
    </div>
  );
}
