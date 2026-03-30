import React, { useRef, useEffect } from 'react';
import { usePlayerStore } from '../../stores/player-store';
import { useVisualizationStore } from '../../stores/visualization-store';
import { visualizationEngine } from '../../visualization/engine';
import { audioAnalyzer } from '../../services/audio/audio-analyzer';
import { getPlayerController } from '../../App';

export function VisualizerCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { enabled, activeEffect, opacity } = useVisualizationStore();
  const playerState = usePlayerStore((s) => s.state);

  // Mount/unmount the engine
  useEffect(() => {
    if (!enabled || !canvasRef.current) return;

    visualizationEngine.mount(canvasRef.current);
    return () => {
      visualizationEngine.unmount();
    };
  }, [enabled]);

  // Set the active effect
  useEffect(() => {
    if (!enabled) return;
    visualizationEngine.setEffect(activeEffect);
  }, [activeEffect, enabled]);

  // Connect audio analyzer when playing
  useEffect(() => {
    if (playerState === 'playing') {
      const controller = getPlayerController();
      if (controller) {
        audioAnalyzer.connect(controller.audioElement);
      }
    }
  }, [playerState]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      visualizationEngine.resize(width, height);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity, zIndex: 0 }}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
