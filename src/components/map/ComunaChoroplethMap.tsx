'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Map, { NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import { GeoJsonLayer } from '@deck.gl/layers';
import { Search, MapPin, Loader2 } from 'lucide-react';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { cn } from '@/lib/utils';
import { useAutoHideHeader } from '@/lib/useAutoHideHeader';
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

// Bounding box de Chile continental (fallback si no se encuentra la RM).
const CHILE_BOUNDS: [[number, number], [number, number]] = [[-75.7, -56.0], [-66.4, -17.4]];
const RM_CODREGION = 13;

// Escala secuencial multi-tono (YlGnBu): amarillo (menos) → verde → azul (más).
// Multi-tono + cuantiles = cada tramo de comunas se distingue con claridad.
const PALETTE: [number, number, number][] = [
  [255, 255, 204], // muy bajo
  [199, 233, 180],
  [127, 205, 187],
  [65, 182, 196],
  [44, 127, 184],
  [37, 52, 148],   // muy alto
];
const NO_DATA: [number, number, number] = [224, 224, 224];
const rgbCss = (c: [number, number, number]) => `rgb(${c[0]},${c[1]},${c[2]})`;

function strip(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

interface Props { choropleth: Record<number, ComunaMetricas> }
interface ComunaProps { cod_comuna: number; Comuna: string; Provincia: string; codregion: number }
type ComunaFeature = Feature<Geometry, ComunaProps>;

export function ComunaChoroplethMap({ choropleth }: Props) {
  const mapRef = useRef<MapRef | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerVisible = useAutoHideHeader(containerRef, 'move');
  const didFit = useRef(false);
  const [geojson, setGeojson] = useState<FeatureCollection<Geometry, ComunaProps> | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [metric, setMetric] = useState<Metric>('montoOC');
  const [busqueda, setBusqueda] = useState('');
  const [hover, setHover] = useState<{ x: number; y: number; cod: number; nombre: string; region: number } | null>(null);
  const [selected, setSelected] = useState<{ cod: number; nombre: string; regionNombre: string; provincia: string } | null>(null);

  useEffect(() => {
    fetch('/comunas-chile.geojson').then((r) => r.json()).then(setGeojson).catch(() => setGeojson(null));
  }, []);

  // Arranque encuadrado en la Región Metropolitana (la consulta más habitual).
  useEffect(() => {
    if (!mapLoaded || !geojson || didFit.current || !mapRef.current) return;
    didFit.current = true;
    const rm = geojson.features.filter((f) => f.properties.codregion === RM_CODREGION);
    const bb = featuresBbox(rm) ?? CHILE_BOUNDS;
    mapRef.current.fitBounds(bb, { padding: 40, duration: 0, maxZoom: 10 });
  }, [mapLoaded, geojson]);

  const isMonto = METRICS.find((m) => m.key === metric)!.isMonto;
  const valOf = useCallback((cod: number) => choropleth[cod]?.[metric] ?? 0, [choropleth, metric]);
  const maxVal = useMemo(() => Math.max(0, ...Object.values(choropleth).map((m) => m[metric])), [choropleth, metric]);
  const q = strip(busqueda.trim());

  // Cortes por cuantiles: cada color agrupa ~1/6 de las comunas con actividad,
  // así la escala reparte el contraste en vez de aplastar todo en un tono.
  const bins = useMemo(() => {
    const vals = Object.values(choropleth).map((m) => m[metric]).filter((v) => v > 0).sort((a, b) => a - b);
    if (vals.length === 0) return [] as number[];
    const N = PALETTE.length;
    const th: number[] = [];
    for (let i = 1; i < N; i++) th.push(vals[Math.min(vals.length - 1, Math.floor((i / N) * vals.length))]);
    return th;
  }, [choropleth, metric]);

  const colorFor = useCallback((v: number): [number, number, number] => {
    if (v <= 0 || bins.length === 0) return NO_DATA;
    let i = 0; while (i < bins.length && v > bins[i]) i++;
    return PALETTE[i];
  }, [bins]);

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
          const [r, g, b] = colorFor(valOf(f.properties.cod_comuna));
          const dim = q.length > 0 && !strip(f.properties.Comuna).includes(q) && !strip(REGION_SHORT[f.properties.codregion] ?? '').includes(q);
          return [r, g, b, dim ? 30 : 220] as [number, number, number, number];
        },
        updateTriggers: { getFillColor: [metric, bins, q] },
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
  }, [geojson, q, valOf, colorFor, bins]);

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
    <div ref={containerRef} className="relative h-full w-full bg-background overflow-hidden">
      {/* Header overlay (auto-ocultable) */}
      <div className={cn(
        'absolute top-0 inset-x-0 z-10 bg-surface/95 backdrop-blur border-b border-borders px-6 py-3 transition-transform duration-300 ease-in-out motion-reduce:transition-none',
        headerVisible ? 'translate-y-0' : '-translate-y-full',
      )}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-h3 font-semibold text-app-text">Punto de partida territorial</h1>
            <p className="text-label text-app-text/50 mt-0.5">
              ¿Dónde se concentra la actividad? Clic en una comuna para analizar · color = {METRICS.find((m) => m.key === metric)!.label.toLowerCase()}
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
        initialViewState={{ longitude: -70.66, latitude: -33.45, zoom: 8 }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        onLoad={() => setMapLoaded(true)}
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

      {/* Legend (escala por tramos) */}
      <div className="absolute bottom-6 left-6 bg-surface/95 backdrop-blur border border-borders rounded-[10px] shadow-lg px-4 py-3 z-10 w-[260px]">
        <p className="text-sm font-semibold text-app-text mb-2">{METRICS.find((m) => m.key === metric)!.label}</p>
        <div className="flex items-stretch gap-0.5">
          {PALETTE.map((c, i) => (
            <span key={i} className="h-4 flex-1 first:rounded-l-[4px] last:rounded-r-[4px]" style={{ background: rgbCss(c) }} />
          ))}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-app-text/60">menos</span>
          <span className="text-xs font-medium text-app-text/70">más · {fmtMetric(maxVal)}</span>
        </div>
        <p className="text-xs text-app-text/50 mt-2 flex items-center gap-2 border-t border-borders pt-2">
          <span className="inline-block h-3.5 w-3.5 rounded-[3px] border border-borders" style={{ background: rgbCss(NO_DATA) }} />
          sin actividad
        </p>
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

// bbox combinado de un conjunto de features (p. ej. todas las comunas de una región).
function featuresBbox(features: ComunaFeature[]): [[number, number], [number, number]] | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const f of features) {
    const bb = geomBbox((f.geometry as { coordinates?: unknown }).coordinates);
    if (!bb) continue;
    if (bb[0][0] < minX) minX = bb[0][0];
    if (bb[0][1] < minY) minY = bb[0][1];
    if (bb[1][0] > maxX) maxX = bb[1][0];
    if (bb[1][1] > maxY) maxY = bb[1][1];
  }
  if (minX === Infinity) return null;
  return [[minX, minY], [maxX, maxY]];
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
