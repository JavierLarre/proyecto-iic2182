import { Skeleton, SkeletonCard } from '@/components/ui';

export default function Loading() {
  return (
    <div className="h-full flex flex-col bg-background" aria-busy="true" aria-label="Cargando licitaciones">
      {/* Header */}
      <div className="bg-surface border-b border-borders px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-3 w-72" />
          </div>
          <Skeleton className="h-8 w-40" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
          {/* Búsqueda */}
          <div className="bg-surface border border-borders rounded-[8px] p-4 space-y-3">
            <Skeleton className="h-12 w-full" />
            <div className="flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-6 w-20 rounded-full" />)}
            </div>
          </div>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Skeleton className="h-64 lg:col-span-2 rounded-[8px]" />
            <Skeleton className="h-64 rounded-[8px]" />
          </div>
          {/* Tabla */}
          <div className="bg-surface border border-borders rounded-[8px] p-4 space-y-3">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        </div>
      </div>
    </div>
  );
}
