import React, { useEffect, useRef, useState } from 'react';

export interface MenuAction {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  submenu?: MenuAction[];
}

interface ContextMenuProps {
  actions: MenuAction[];
  onClose: () => void;
  anchorEl: HTMLElement | null;
}

export function ContextMenu({ actions, onClose, anchorEl }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Position the menu relative to the anchor element
  useEffect(() => {
    if (!anchorEl || !menuRef.current) return;
    const anchorRect = anchorEl.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let top = anchorRect.bottom + 4;
    let left = anchorRect.right - menuRect.width;

    // Keep within viewport
    if (left < 8) left = 8;
    if (left + menuRect.width > viewportW - 8) left = viewportW - menuRect.width - 8;
    if (top + menuRect.height > viewportH - 8) top = anchorRect.top - menuRect.height - 4;

    setPosition({ top, left });
  }, [anchorEl]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] py-1 bg-surface-800 border border-surface-700 rounded-lg shadow-xl"
      style={{ top: position.top, left: position.left }}
    >
      {actions.map((action, i) => (
        <div
          key={i}
          className="relative"
          onMouseEnter={() => {
            if (action.submenu) {
              if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
              setOpenSubmenuIndex(i);
            }
          }}
          onMouseLeave={() => {
            if (action.submenu) {
              closeTimer.current = setTimeout(() => setOpenSubmenuIndex(null), 150);
            }
          }}
        >
          <button
            onClick={() => {
              if (action.submenu) {
                setOpenSubmenuIndex(openSubmenuIndex === i ? null : i);
              } else if (action.onClick) {
                action.onClick();
                onClose();
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-200 hover:bg-surface-700 transition-colors"
          >
            {action.icon && <span className="w-4 h-4 shrink-0">{action.icon}</span>}
            <span className="flex-1 text-left">{action.label}</span>
            {action.submenu && (
              <svg className="w-3 h-3 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>

          {/* Submenu */}
          {action.submenu && openSubmenuIndex === i && (
            <Submenu actions={action.submenu} onClose={onClose} onMouseEnter={() => {
              if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
            }} onMouseLeave={() => {
              closeTimer.current = setTimeout(() => setOpenSubmenuIndex(null), 150);
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

interface SubmenuProps {
  actions: MenuAction[];
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function Submenu({ actions, onClose, onMouseEnter, onMouseLeave }: SubmenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<'right' | 'left'>('right');

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    if (rect.right > window.innerWidth - 8) {
      setSide('left');
    }
  }, []);

  return (
    <div
      ref={ref}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`absolute top-0 z-50 min-w-[180px] py-1 bg-surface-800 border border-surface-700 rounded-lg shadow-xl ${
        side === 'right' ? 'left-full -ml-1' : 'right-full -mr-1'
      }`}
    >
      {actions.map((action, i) => (
        <button
          key={i}
          onClick={() => {
            action.onClick?.();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-200 hover:bg-surface-700 transition-colors"
        >
          {action.icon && <span className="w-4 h-4 shrink-0">{action.icon}</span>}
          <span className="flex-1 text-left">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
