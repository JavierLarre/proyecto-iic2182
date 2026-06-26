import { Skeleton } from '@/components/ui';

export default function Loading() {
  return (
    <div className="h-full flex flex-col bg-background" aria-busy="true" aria-label="Cargando órdenes de compra">
      {/* Header: título + selects región/comuna */}
      <div className="bg-surface border-b border-borders px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-80" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-44" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
          {/* Hero: termómetro de concentración */}
          <div className="bg-surface border border-borders rounded-[12px] p-5 space-y-4">
            <Skeleton className="h-7 w-96 max-w-full" />
            <Skeleton className="h-6 w-full rounded-[6px]" />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-[8px]" />)}
            </div>
          </div>

          {/* Leaderboard + competencia por región (lado a lado) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-surface border border-borders rounded-[8px] p-4 space-y-3">
                <Skeleton className="h-4 w-40" />
                {Array.from({ length: 7 }).map((_, j) => <Skeleton key={j} className="h-8 w-full" />)}
              </div>
            ))}
          </div>

          {/* Evidencia: tabla de órdenes */}
          <div className="bg-surface border border-borders rounded-[8px] p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-28" />
            </div>
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        </div>
      </div>
    </div>
  );
}
