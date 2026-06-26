'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fmtInt } from '@/lib/format';

/** Genera la secuencia de páginas con elipsis: 1 … 4 5 [6] 7 8 … N */
function pageWindow(current: number, count: number): (number | '…')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i);
  const out: (number | '…')[] = [0];
  const lo = Math.max(1, current - 1);
  const hi = Math.min(count - 2, current + 1);
  if (lo > 1) out.push('…');
  for (let i = lo; i <= hi; i++) out.push(i);
  if (hi < count - 2) out.push('…');
  out.push(count - 1);
  return out;
}

interface PagerProps {
  page: number;            // 0-based
  pageCount: number;       // total de páginas conocidas (capeado)
  total: number;           // total de filas (capeado)
  capped: boolean;         // true si el total real supera el techo
  noun?: string;           // "órdenes" | "oportunidades"
  loading?: boolean;
  onPage: (p: number) => void;
}

export function Pager({ page, pageCount, total, capped, noun = 'resultados', loading, onPage }: PagerProps) {
  const count = Math.max(1, pageCount);
  const pages = pageWindow(page, count);
  const go = (p: number) => { if (p >= 0 && p < count && p !== page && !loading) onPage(p); };

  const btn = 'inline-flex h-8 min-w-8 items-center justify-center rounded-[6px] border border-borders px-2 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-background';

  return (
    <div className="flex items-center justify-between gap-3 border-t border-borders px-4 py-3 flex-wrap">
      <span className="text-xs text-app-text/50 tabular-nums" aria-live="polite">
        {fmtInt(total)}{capped ? '+' : ''} {noun} · página {page + 1} de {fmtInt(count)}{capped ? '+' : ''}
      </span>

      <nav className="flex items-center gap-1" aria-label="Paginación">
        <button onClick={() => go(0)} disabled={page <= 0 || loading} aria-label="Primera página" className={btn}>
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => go(page - 1)} disabled={page <= 0 || loading} aria-label="Página anterior" className={btn}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Números (se ocultan en pantallas muy chicas para no desbordar) */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="px-1 text-xs text-app-text/30 select-none">…</span>
            ) : (
              <button key={p} onClick={() => go(p)} disabled={loading}
                aria-label={`Página ${p + 1}`} aria-current={p === page ? 'page' : undefined}
                className={cn(btn, 'font-medium', p === page && 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/10')}>
                {p + 1}
              </button>
            ),
          )}
        </div>

        <button onClick={() => go(page + 1)} disabled={page >= count - 1 || loading} aria-label="Página siguiente" className={btn}>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => go(count - 1)} disabled={page >= count - 1 || loading} aria-label="Última página" className={btn}>
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
      </nav>
    </div>
  );
}
