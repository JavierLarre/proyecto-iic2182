'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Panel lateral deslizante (right drawer). Se cierra con Escape, el botón
 * de cierre o haciendo clic en el overlay. Animación respetando
 * prefers-reduced-motion mediante `motion-reduce:transition-none`.
 */
export function DetailDrawer({ open, onClose, title, subtitle, children }: DetailDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-app-text/20 transition-opacity duration-300 motion-reduce:transition-none',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-2xl',
          'border-l border-borders transition-transform duration-300 ease-in-out motion-reduce:transition-none',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-borders px-5 py-4 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-app-text leading-snug">{title}</h2>
            {subtitle && <p className="text-label text-app-text/50 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar detalle"
            className="flex-shrink-0 rounded-[6px] p-1 text-app-text/50 hover:bg-borders/40 hover:text-app-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </>
  );
}
