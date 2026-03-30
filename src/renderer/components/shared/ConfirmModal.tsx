import React, { useEffect, useRef } from 'react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onMouseDown={onCancel}>
      <div
        className="bg-surface-800 border border-surface-700 rounded-xl shadow-2xl p-5 w-80"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-surface-400 mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-surface-300 hover:text-white rounded-lg hover:bg-surface-700 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={`px-3 py-1.5 text-sm text-white rounded-lg transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-accent-600 hover:bg-accent-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
