'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Map, { NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import { GeoJsonLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Search, MapPin, Loader2 } from 'lucide-react';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { cn } from '@/lib/utils';
import { fmtCLP, fmtInt } from '@/lib/format';
import { DeckGLOverlay } from './DeckGLOverlay';
import { MAP_STYLE } from './types';
import { ComunaPanel } from './ComunaPanel';
import type { ComunaMetricas } from '@/lib/data/mapa';

type Metric = 'montoOC' | 'nOrdenes' | 'nLicitaciones' | 'montoLic';
const METRICS: { key: Metric; label: string; isMonto: boolean }[] = [
  { key: 'montoOC', label: 'Monto órdenes', isMonto: true },
  { key: 'nOrdenes', label: 'N° órdenes', isMonto: false },
  { key: 'nLicitaciones', label: 'N° licitaciones', isMonto: false },
  { key: 'montoLic', label: 'Monto licitaciones', isMonto: true },
];

const REGION_SHORT: Record<number, string> = {
  1: 'Tarapacá', 2: 'Antofagasta', 3: 'Atacama', 4: 'Coquimbo', 5: 'Valparaíso',
  6: "O'Higgins", 7: 'Maule', 8: 'Biobío', 9: 'La Araucanía', 10: 'Los Lagos',
  11: 'Aysén', 12: 'Magallanes', 13: 'Metropolitana', 14: 'Los Ríos',
  15: 'Arica y Parinacota', 16: 'Ñuble',
};

// Bounding box de Chile continental (excluye Isla de Pascua/Juan Fernández).
const CHILE_BOUNDS: [[number, number], [number, number]] = [[-75.7, -56.0], [-66.4, -17.4]];

const C_LOW = [226, 240, 247];
const C_HIGH = [12, 74, 110];
function rgbFor(t: number): [number, number, number] {
  const k = Math.max(0, Math.min(1, t));
  return C_LOW.map((lo, i) => Math.round(lo + (C_HIGH[i] - lo) * k)) as [number, number, number];
}
function strip(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
function legendColor(t: number): string {
  const [r, g, b] = rgbFor(t);
  return `rgb(${r},${g},${b})`;
}

interface Props { choropleth: Record<number, ComunaMetricas> }
interface ComunaProps { cod_comuna: number; Comuna: string; Provincia: string; codregion: number }
type ComunaFeature = Feature<Geometry, ComunaProps>;

export function ComunaChoroplethMap({ choropleth }: Props) {
  const mapRef = useRef<MapRef | null>(null);
  const [geojson, setGeojson] = useState<FeatureCollection<Geometry, ComunaProps> | null>(null);
  const [metric, setMetric] = useState<Metric>('montoOC');
  const [busqueda, setBusqueda] = useState('');
  const [hover, setHover] = useState<{ x: number; y: number; cod: number; nombre: string; region: number } | null>(null);
  const [selected, setSelected] = useState<{ cod: number; nombre: string; regionNombre: string; provincia: string } | null>(null);

  useEffect(() => {
    fetch('/comunas-chile.geojson').then((r) => r.json()).then(setGeojson).catch(() => setGeojson(null));
  }, []);

  const isMonto = METRICS.find((m) => m.key === metric)!.isMonto;
  const valOf = useCallback((cod: number) => choropleth[cod]?.[metric] ?? 0, [choropleth, metric]);
  const maxVal = useMemo(() => Math.max(0, ...Object.values(choropleth).map((m) => m[metric])), [choropleth, metric]);
  const logMax = Math.log(1 + maxVal);
  const q = strip(busqueda.trim());

  const layers = useMemo(() => {
    if (!geojson) return [];
    return [
      new GeoJsonLayer<ComunaProps>({
        id: 'comunas',
        data: geojson,
        pickable: true,
        stroked: true,
        filled: true,
        autoHighlight: true,
        highlightColor: [73, 197, 239, 160],
        lineWidthMinPixels: 0.4,
        getLineColor: [255, 255, 255, 200],
        getFillColor: (f: ComunaFeature) => {
          const v = valOf(f.properties.cod_comuna);
          const t = logMax > 0 ? Math.log(1 + v) / logMax : 0;
          const [r, g, b] = v > 0 ? rgbFor(t) : [225, 225, 225];
          const dim = q.length > 0 && !strip(f.properties.Comuna).includes(q) && !strip(REGION_SHORT[f.properties.codregion] ?? '').includes(q);
          return [r, g, b, dim ? 30 : 210] as [number, number, number, number];
        },
        updateTriggers: { getFillColor: [metric, logMax, q] },
        onHover: (info) => {
          const o = info.object as ComunaFeature | undefined;
          setHover(o ? { x: info.x, y: info.y, cod: o.properties.cod_comuna, nombre: o.properties.Comuna, region: o.properties.codregion } : null);
        },
        onClick: (info) => {
          const o = info.object as ComunaFeature | undefined;
          if (o) setSelected({
            cod: o.properties.cod_comuna,
            nombre: o.properties.Comuna,
            provincia: o.properties.Provincia,
            regionNombre: REGION_SHORT[o.properties.codregion] ?? '',
          });
        },
      }),
    ];
  }, [geojson, metric, logMax, q, valOf]);

  // Buscar comuna → encuadrar.
  useEffect(() => {
    if (!q || !geojson || !mapRef.current) return;
    const match = geojson.features.find((f) => strip(f.properties.Comuna).includes(q));
    if (!match) return;
    const geom = match.geometry as { coordinates?: unknown };
    const bb = geomBbox(geom.coordinates);
    if (bb) mapRef.current.fitBounds(bb, { padding: 80, maxZoom: 11, duration: 800 });
  }, [q, geojson]);

  const hoverMetrics = hover ? choropleth[hover.cod] : null;
  const fmtMetric = (v: number) => (isMonto ? fmtCLP(v) : fmtInt(v));

  return (
    <div className="relative h-full w-full bg-background overflow-hidden">
      {/* Header overlay */}
      <div className="absolute top-0 inset-x-0 z-10 bg-surface/95 backdrop-blur border-b border-borders px-6 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-h3 font-semibold text-app-text">Mapa territorial por comuna</h1>
            <p className="text-label text-app-text/50 mt-0.5">
              Límites comunales · clic para analizar · color = {METRICS.find((m) => m.key === metric)!.label.toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-app-text/30 pointer-events-none" strokeWidth={1.5} />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar comuna..."
                className="pl-8 pr-3 py-1.5 text-sm bg-surface border border-borders rounded-[6px] focus:outline-none focus:border-2 focus:border-primary w-[200px]"
              />
            </div>
            <div className="flex items-center gap-1 bg-background rounded-[8px] p-1">
              {METRICS.map((m) => (
                <button key={m.key} onClick={() => setMetric(m.key)}
                  className={cn('text-xs px-2.5 py-1 rounded-[6px] transition-colors whitespace-nowrap',
                    metric === m.key ? 'bg-surface shadow-sm font-medium text-app-text' : 'text-app-text/50 hover:text-app-text')}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!geojson && (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-app-text/50">
          <Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Cargando mapa de comunas...</span>
        </div>
      )}

      <Map
        ref={mapRef}
        initialViewState={{ longitude: -71, latitude: -38, zoom: 3.4 }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        onLoad={() => mapRef.current?.fitBounds(CHILE_BOUNDS, { padding: 24, duration: 0 })}
      >
        <DeckGLOverlay layers={layers} />
        <NavigationControl position="bottom-right" />
      </Map>

      {/* Hover tooltip */}
      {hover && (
        <div
          className="absolute z-20 bg-surface border border-borders rounded-[8px] shadow-lg px-3 py-2 w-[210px] pointer-events-none"
          style={{ left: Math.min(hover.x + 14, 9999), top: hover.y + 14 }}
        >
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
            <span className="text-sm font-semibold text-app-text truncate">{hover.nombre}</span>
          </div>
          <p className="text-label text-app-text/50 mb-1.5">{REGION_SHORT[hover.region] ?? ''}</p>
          <dl className="space-y-0.5 text-xs">
            <Row label="Monto órdenes" value={fmtCLP(hoverMetrics?.montoOC ?? 0)} />
            <Row label="N° órdenes" value={fmtInt(hoverMetrics?.nOrdenes ?? 0)} />
            <Row label="Licitaciones" value={fmtInt(hoverMetrics?.nLicitaciones ?? 0)} />
          </dl>
          <p className="text-[10px] text-app-text/40 mt-1.5">Clic para ver el análisis completo</p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-5 left-5 bg-surface/95 backdrop-blur border border-borders rounded-[8px] px-3 py-2 z-10">
        <p className="text-[10px] text-app-text/50 mb-1">{METRICS.find((m) => m.key === metric)!.label}</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-app-text/60">0</span>
          <div className="h-2 w-28 rounded-full" style={{ background: `linear-gradient(to right, ${legendColor(0)}, ${legendColor(0.5)}, ${legendColor(1)})` }} />
          <span className="text-[10px] text-app-text/60">{fmtMetric(maxVal)}</span>
        </div>
      </div>

      {selected && (
        <ComunaPanel
          key={selected.cod}
          cod={selected.cod}
          nombre={selected.nombre}
          regionNombre={selected.regionNombre}
          provincia={selected.provincia}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-app-text/50">{label}</dt>
      <dd className="font-medium text-app-text">{value}</dd>
    </div>
  );
}

// bbox [[w,s],[e,n]] de una geometría Polygon/MultiPolygon.
function geomBbox(coords: unknown): [[number, number], [number, number]] | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const walk = (a: unknown) => {
    if (Array.isArray(a) && typeof a[0] === 'number' && typeof a[1] === 'number') {
      const [x, y] = a as number[];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    } else if (Array.isArray(a)) {
      for (const el of a) walk(el);
    }
  };
  walk(coords);
  if (minX === Infinity) return null;
  return [[minX, minY], [maxX, maxY]];
}
