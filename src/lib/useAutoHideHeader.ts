'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Header auto-ocultable. Devuelve `visible`.
 * - mode 'scroll': se oculta al hacer scroll hacia abajo dentro del contenedor,
 *   reaparece al subir o al llegar arriba.
 * - mode 'move': se oculta al mover el puntero sobre el contenedor (lejos del borde
 *   superior) — útil donde no hay scroll (mapa).
 * En ambos modos, acercar el puntero al borde superior del contenedor lo revela.
 */
export function useAutoHideHeader(
  containerRef: RefObject<HTMLElement | null>,
  mode: 'scroll' | 'move',
): boolean {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const clearHide = () => { if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; } };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right) return;
      // Cerca del borde superior (o por encima, p. ej. sobre el navbar) → revelar.
      if (e.clientY <= r.top + 72) { clearHide(); setVisible(true); }
      else if (e.clientY <= r.bottom && mode === 'move' && !hideTimer.current) {
        hideTimer.current = setTimeout(() => { setVisible(false); hideTimer.current = null; }, 700);
      }
    };
    const onScroll = () => {
      const y = el.scrollTop;
      if (y < 8) setVisible(true);
      else if (y > lastY.current + 6) setVisible(false);
      else if (y < lastY.current - 6) setVisible(true);
      lastY.current = y;
    };

    // Captura (top-down): así recibimos el evento aunque maplibre detenga la
    // propagación en el canvas del mapa.
    window.addEventListener('pointermove', onMove, true);
    if (mode === 'scroll') el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove, true);
      el.removeEventListener('scroll', onScroll);
      clearHide();
    };
  }, [containerRef, mode]);

  return visible;
}
