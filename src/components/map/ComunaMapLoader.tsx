'use client';

import dynamic from 'next/dynamic';
import type { ComunaMetricas } from '@/lib/data/mapa';
import { MapSkeleton } from './MapSkeleton';

// maplibre-gl necesita `window`, así que el mapa se carga solo en el cliente.
const Mapa = dynamic(
  () => import('./ComunaChoroplethMap').then((m) => m.ComunaChoroplethMap),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  },
);

export function ComunaMapLoader({ choropleth }: { choropleth: Record<number, ComunaMetricas> }) {
  return <Mapa choropleth={choropleth} />;
}
