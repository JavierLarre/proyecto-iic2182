import { Skeleton } from '@/components/ui';

/** Skeleton compartido del mapa — usado por loading.tsx (navegación) y por
 *  el fallback del import dinámico de maplibre (carga del cliente). */
export function MapSkeleton() {
  return (
    <div className="relative h-full w-full bg-background overflow-hidden" aria-busy="true" aria-label="Cargando mapa">
      {/* Header overlay — igual que el header real del mapa */}
      <div className="absolute top-0 inset-x-0 z-10 bg-surface/95 backdrop-blur border-b border-borders px-6 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-3 w-72" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
      </div>

      {/* Lienzo del mapa */}
      <div className="absolute inset-0 flex items-center justify-center bg-borders/15">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <p className="text-sm text-app-text/40">Cargando mapa territorial…</p>
        </div>
      </div>
    </div>
  );
}
