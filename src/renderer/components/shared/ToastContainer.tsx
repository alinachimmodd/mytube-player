import React from 'react';
import { useToastStore } from '../../stores/toast-store';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[200] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-xl border animate-in slide-in-from-right ${
            toast.type === 'error'
              ? 'bg-red-950/90 border-red-800/50 text-red-200'
              : toast.type === 'success'
                ? 'bg-green-950/90 border-green-800/50 text-green-200'
                : 'bg-surface-800/90 border-surface-700/50 text-surface-200'
          }`}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm">{toast.message}</p>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.onClick();
                  removeToast(toast.id);
                }}
                className="mt-2 text-xs font-medium text-accent-400 hover:text-accent-300 transition-colors"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
