import { Skeleton, SkeletonCard } from '@/components/ui';

export default function Loading() {
  return (
    <div className="h-full flex flex-col bg-background" aria-busy="true" aria-label="Cargando licitaciones">
      {/* Header: título + selects región/comuna */}
      <div className="bg-surface border-b border-borders px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-72" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-44" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
          {/* Buscador por rubro: input + chips */}
          <div className="bg-surface border border-borders rounded-[8px] p-4 space-y-3">
            <Skeleton className="h-12 w-full rounded-[8px]" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-6 w-24 rounded-full" />)}
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>

          {/* Lista de oportunidades: header + tarjetas (grilla) */}
          <div className="bg-surface border border-borders rounded-[8px] p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-8 w-56" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-[10px]" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
