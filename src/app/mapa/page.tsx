'use client';

import dynamic from 'next/dynamic';

const ProveedorMapView = dynamic(
  () => import('@/components/map/ProveedorMapView').then(m => ({ default: m.ProveedorMapView })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Cargando mapa...</p>
      </div>
    ),
  }
);

export default function MapaPage() {
  return (
    <div className="h-full w-full">
      <ProveedorMapView />
    </div>
  );
}
