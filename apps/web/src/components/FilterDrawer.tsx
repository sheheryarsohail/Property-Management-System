import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  activeCount?: number;
  onReset?: () => void;
  onApply?: () => void;
  children: React.ReactNode;
}

export function FilterDrawer({
  isOpen,
  onClose,
  title = 'Filter',
  activeCount = 0,
  onReset,
  onApply,
  children,
}: FilterDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key press and lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 !m-0 !p-0 z-[100] flex justify-start">
      {/* Solid Dark Backdrop - NO glassmorphism / NO blur */}
      <div
        className="fixed inset-0 top-0 left-0 right-0 bottom-0 bg-slate-950/60 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel: Starts at EXACT (0,0), opens from the LEFT, acquires FULL VIEWPORT on phone, max-w-md on tablet/desktop */}
      <div className="relative z-[101] flex h-full w-full sm:max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-250 ease-out border-r border-slate-200 !m-0 !p-0">
        {/* Drawer Header: Solid White, NO glassmorphism */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shrink-0 shadow-sm">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 truncate">Filter</h3>
                {activeCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                    {activeCount} active
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Close filter"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body: Solid White, Clean Contrast, NO glassmorphism */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 text-sm bg-white">
          {children}
        </div>

        {/* Drawer Footer: Solid White, NO glassmorphism */}
        <div className="flex items-center gap-3 border-t border-slate-200 bg-white px-5 py-4 shadow-sm shrink-0">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear All
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (onApply) onApply();
              onClose();
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white hover:bg-primary/90 transition shadow-sm"
          >
            <Check className="h-4 w-4" />
            Apply Filters
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
