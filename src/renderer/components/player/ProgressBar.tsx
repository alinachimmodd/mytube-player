import React, { useCallback, useRef, useState } from 'react';
import { usePlayerStore } from '../../stores/player-store';
import { getPlayerController } from '../../App';
import { formatDuration } from '@shared/utils';

export function ProgressBar() {
  const { currentTime, duration } = usePlayerStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  const progress = duration > 0 ? ((isDragging ? dragTime : currentTime) / duration) * 100 : 0;

  const getTimeFromPosition = useCallback(
    (clientX: number): number => {
      if (!barRef.current || duration <= 0) return 0;
      const rect = barRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    const time = getTimeFromPosition(e.clientX);
    setDragTime(time);
    setIsDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      setDragTime(getTimeFromPosition(e.clientX));
    };

    const handleMouseUp = (e: MouseEvent) => {
      const finalTime = getTimeFromPosition(e.clientX);
      getPlayerController()?.seekTo(finalTime);
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="flex items-center gap-2 w-full max-w-[600px]">
      <span className="text-[10px] text-surface-400 tabular-nums w-10 text-right">
        {formatDuration(isDragging ? dragTime : currentTime)}
      </span>

      <div
        ref={barRef}
        className="flex-1 h-1 bg-surface-700 rounded-full cursor-pointer group relative"
        onMouseDown={handleMouseDown}
      >
        {/* Progress fill */}
        <div
          className="h-full bg-accent-500 rounded-full relative transition-none"
          style={{ width: `${progress}%` }}
        >
          {/* Thumb */}
          <div
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow transition-transform ${
              isDragging ? 'scale-100' : 'scale-0 group-hover:scale-100'
            }`}
          />
        </div>
      </div>

      <span className="text-[10px] text-surface-400 tabular-nums w-10">
        {formatDuration(duration)}
      </span>
    </div>
  );
}
