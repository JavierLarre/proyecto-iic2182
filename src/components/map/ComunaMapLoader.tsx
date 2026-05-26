'use client';

import dynamic from 'next/dynamic';
import type { ComunaMetricas } from '@/lib/data/mapa';

// maplibre-gl necesita `window`, así que el mapa se carga solo en el cliente.
const Mapa = dynamic(
  () => import('./ComunaChoroplethMap').then((m) => m.ComunaChoroplethMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-background text-app-text/50 text-sm">
        Cargando mapa...
      </div>
    ),
  },
);

export function ComunaMapLoader({ choropleth }: { choropleth: Record<number, ComunaMetricas> }) {
  return <Mapa choropleth={choropleth} />;
}
