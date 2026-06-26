'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const SIZE: Record<NonNullable<DetailDrawerProps['size']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
};

/**
 * Ventana modal centrada (mismo patrón que el panel de comuna del mapa): el fondo
 * se desvanece y difumina, y una card aparece en el centro con fade + scale.
 * Se cierra con Escape, el botón ✕ o haciendo clic en el backdrop. Respeta
 * prefers-reduced-motion mediante `motion-reduce:transition-none`.
 */
export function DetailDrawer({ open, onClose, title, subtitle, size = 'lg', children }: DetailDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        open ? '' : 'pointer-events-none',
      )}
    >
      {/* Backdrop: desvanece + difumina el fondo */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-app-text/30 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Card centrada */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex w-full max-h-[88vh] flex-col overflow-hidden rounded-[12px]',
          SIZE[size],
          'border border-borders bg-surface shadow-2xl transition-all duration-300 ease-out motion-reduce:transition-none',
          open ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
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
      </div>
    </div>
  );
}
