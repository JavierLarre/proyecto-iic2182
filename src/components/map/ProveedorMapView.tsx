'use client';

import { useState, useMemo, useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';

import { MapCanvas } from './MapCanvas';
import { MapSidebar } from './MapSidebar';
import { isPointInsideCircle, type FiltrosProveedor, type Proveedor } from './types';
import { PROVEEDORES, RUBROS_DISPONIBLES } from '@/data/proveedores';
import { cn } from '@/lib/utils';

const DEFAULT_FILTROS: FiltrosProveedor = {
  rubro: null,
  radioKm: 5,           // default 5 km, slider siempre activo
  centroRadio: null,    // sin círculo hasta que el usuario haga clic
};

export function ProveedorMapView() {
  const [filtros, setFiltros] = useState<FiltrosProveedor>(DEFAULT_FILTROS);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Filtrados por rubro/región — usados para las stats del sidebar
  const filteredProveedores = useMemo(() => {
    return PROVEEDORES.filter(p => {
      if (filtros.rubro && p.rubro !== filtros.rubro) return false;
      return true;
    });
  }, [filtros.rubro]);

  // Lo que se muestra en el mapa: vacío hasta que el usuario hace clic
  const mapProveedores = useMemo(() => {
    if (!filtros.centroRadio) return [];
    return filteredProveedores.filter(p =>
      isPointInsideCircle(p, filtros.centroRadio!, filtros.radioKm)
    );
  }, [filteredProveedores, filtros.centroRadio, filtros.radioKm]);

  // Cualquier clic en el mapa mueve el centro del radio
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setFiltros(f => ({ ...f, centroRadio: { lat, lng } }));
    setSelectedProveedor(null);
  }, []);

  const handleProveedorClick = useCallback((p: Proveedor) => {
    setSelectedProveedor(prev => (prev?.id === p.id ? null : p));
    setSidebarOpen(true); // abrir sidebar para mostrar info
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Sidebar */}
      <div className="absolute inset-y-0 left-0 z-20 flex">
        <div className={cn(
          'h-full border-r shadow-lg overflow-hidden',
          'transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-72' : 'w-0'
        )}>
          <div className="w-72 h-full">
            <MapSidebar
              filtros={filtros}
              onFiltrosChange={setFiltros}
              rubrosDisponibles={RUBROS_DISPONIBLES}
              filteredProveedores={filteredProveedores}
              mapCount={mapProveedores.length}
              selectedProveedor={selectedProveedor}
              onClearSelected={() => setSelectedProveedor(null)}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>

        {/* Toggle button pegado al borde, siempre visible */}
        <div className="relative flex items-start pt-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              'h-10 w-8 bg-white shadow-lg',
              'rounded-r-xl border border-l-0 border-gray-200',
              'hover:bg-gray-50 transition-colors',
              'flex items-center justify-center'
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Mapa */}
      <MapCanvas
        proveedores={mapProveedores}
        centroRadio={filtros.centroRadio}
        radioKm={filtros.radioKm}
        selectedProveedor={selectedProveedor}
        onProveedorClick={handleProveedorClick}
        onMapClick={handleMapClick}
      />
    </div>
  );
}
