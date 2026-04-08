import { X, Target, MapPin, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isPointInsideCircle, type FiltrosProveedor, type Proveedor } from './types';
import { PROVEEDORES } from '@/data/proveedores';

interface MapSidebarProps {
  filtros: FiltrosProveedor;
  onFiltrosChange: (f: FiltrosProveedor) => void;
  rubrosDisponibles: string[];
  filteredProveedores: Proveedor[];   // filtrados por rubro (para barras)
  mapCount: number;                   // cuántos se muestran en el mapa (dentro del radio)
  selectedProveedor: Proveedor | null;
  onClearSelected: () => void;
  onClose: () => void;
}

const REGIONES_NORTE_SUR = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana',
  "O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes',
];

// Conteo por región: total registrado (barra gris) y dentro del radio (barra azul, solo si hay centro)
function useRegionStats(filteredProveedores: Proveedor[], filtros: FiltrosProveedor) {
  const presentRegions = new Set(PROVEEDORES.map(p => p.region));
  const allRegions = REGIONES_NORTE_SUR.filter(r => presentRegions.has(r));
  const maxCount = Math.max(...allRegions.map(r => PROVEEDORES.filter(p => p.region === r).length));

  return allRegions.map(region => {
    const total = PROVEEDORES.filter(p => p.region === region).length;
    const inRadius = filtros.centroRadio
      ? filteredProveedores.filter(
          p => p.region === region &&
          isPointInsideCircle(p, filtros.centroRadio!, filtros.radioKm)
        ).length
      : null; // null = sin centro, no mostrar barra azul

    return { region, total, inRadius, maxCount };
  });
}

export function MapSidebar({
  filtros,
  onFiltrosChange,
  rubrosDisponibles,
  filteredProveedores,
  mapCount,
  selectedProveedor,
  onClearSelected,
  onClose,
}: MapSidebarProps) {
  const set = (partial: Partial<FiltrosProveedor>) =>
    onFiltrosChange({ ...filtros, ...partial });

  const regionStats = useRegionStats(filteredProveedores, filtros);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <h2 className="font-semibold text-gray-900 text-sm">Proveedores</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-400"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Panel proveedor seleccionado */}
        {selectedProveedor && (
          <div className="mx-3 mt-3 rounded-xl border border-blue-200 bg-blue-50 overflow-hidden">
            <div className="flex items-start justify-between px-3 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                  Proveedor seleccionado
                </span>
              </div>
              <button
                onClick={onClearSelected}
                className="text-blue-400 hover:text-blue-600 flex-shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="px-3 pb-3 space-y-1.5">
              <p className="font-semibold text-sm text-gray-900 leading-snug">
                {selectedProveedor.razonSocial}
              </p>
              <span className="inline-block bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {selectedProveedor.rubro}
              </span>
              <div className="flex items-start gap-1.5 text-xs text-gray-600 pt-0.5">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-gray-400" />
                <span>
                  {selectedProveedor.direccion}<br />
                  {selectedProveedor.comuna}, Región {selectedProveedor.region}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 space-y-5">
          {/* Filtros */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Filtros
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Rubro</label>
              <select
                value={filtros.rubro ?? ''}
                onChange={e => set({ rubro: e.target.value || null })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los rubros</option>
                {rubrosDisponibles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

          </section>

          <div className="border-t border-gray-100" />

          {/* Radio de búsqueda — slider continuo */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              Radio de búsqueda
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Radio:</span>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  {filtros.radioKm} km
                </span>
              </div>

              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={filtros.radioKm}
                onChange={e => set({ radioKm: Number(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />

              <div className="flex justify-between text-xs text-gray-400">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>

            {filtros.centroRadio ? (
              <div className="space-y-2">
                <div className="flex items-start gap-1.5 text-xs px-3 py-2 rounded-lg bg-green-50 text-green-700">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    Lat {filtros.centroRadio.lat.toFixed(4)},
                    Lng {filtros.centroRadio.lng.toFixed(4)}
                  </span>
                </div>
                <button
                  onClick={() => set({ centroRadio: null })}
                  className="w-full text-xs text-gray-500 hover:text-gray-700 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Limpiar radio
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
                Haz clic en el mapa para activar el radio
              </p>
            )}
          </section>

          <div className="border-t border-gray-100" />

          {/* Proveedores por región */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Proveedores por región
            </h3>

            <div className="space-y-2">
              {regionStats.map(({ region, total, inRadius, maxCount }) => (
                <div key={region} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 truncate flex-1 mr-2">
                      {region}
                    </span>
                    <span className="flex-shrink-0 text-gray-500">
                      {inRadius !== null
                        ? <><span className="font-semibold text-gray-800">{inRadius}</span>/{total}</>
                        : <span className="font-semibold text-gray-700">{total}</span>
                      }
                    </span>
                  </div>
                  {/* Barra gris = total registrado; azul = dentro del radio (solo si hay centro) */}
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-200 rounded-full relative"
                      style={{ width: `${(total / maxCount) * 100}%` }}
                    >
                      {inRadius !== null && (
                        <div
                          className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${total > 0 ? (inRadius / total) * 100 : 0}%` }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        {filtros.centroRadio ? (
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-blue-600">{mapCount}</span>
            {' '}{mapCount === 1 ? 'proveedor en el radio' : 'proveedores en el radio'}
          </p>
        ) : (
          <p className="text-xs text-gray-400">
            Haz clic en el mapa para buscar proveedores
          </p>
        )}
      </div>
    </div>
  );
}
