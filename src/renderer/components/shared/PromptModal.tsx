import React, { useEffect, useRef, useState } from 'react';

interface PromptModalProps {
  title: string;
  placeholder?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function PromptModal({ title, placeholder, onConfirm, onCancel }: PromptModalProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onMouseDown={onCancel}>
      <div
        className="bg-surface-800 border border-surface-700 rounded-xl shadow-2xl p-5 w-80"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder || ''}
            className="w-full px-3 py-2 rounded-lg bg-surface-900 border border-surface-600 text-white text-sm placeholder-surface-500 focus:outline-none focus:border-accent-500 transition-colors"
            onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-sm text-surface-300 hover:text-white rounded-lg hover:bg-surface-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="px-3 py-1.5 text-sm text-white bg-accent-600 hover:bg-accent-500 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
