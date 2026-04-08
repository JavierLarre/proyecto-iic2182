import { useState, useMemo, useCallback } from 'react';
import Map, { NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { ScatterplotLayer, PolygonLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';

import { DeckGLOverlay } from './DeckGLOverlay';
import { ClusterMarker } from './ClusterMarker';
import { useMarkerClustering, type ClusterInput } from '@/hooks/useMarkerClustering';
import {
  CHILE_CENTER,
  MAP_STYLE,
  generateCirclePolygon,
  type Proveedor,
  type ClickedPoint,
} from './types';

interface MapCanvasProps {
  proveedores: Proveedor[];
  centroRadio: ClickedPoint | null;
  radioKm: number | null;
  selectedProveedor: Proveedor | null;
  onProveedorClick: (p: Proveedor) => void;
  onMapClick: (lat: number, lng: number) => void;
}

export function MapCanvas({
  proveedores,
  centroRadio,
  radioKm,
  onProveedorClick,
  onMapClick,
}: MapCanvasProps) {
  const [viewState, setViewState] = useState(CHILE_CENTER);

  // Bounds calculados matemáticamente desde el viewState (igual que referencia)
  const bounds = useMemo(() => {
    const latRange = 180 / Math.pow(2, viewState.zoom);
    const lngRange = 360 / Math.pow(2, viewState.zoom);
    return [
      viewState.longitude - lngRange,
      viewState.latitude - latRange,
      viewState.longitude + lngRange,
      viewState.latitude + latRange,
    ] as [number, number, number, number];
  }, [viewState.zoom, viewState.longitude, viewState.latitude]);

  const proveedorPoints: ClusterInput[] = useMemo(
    () => proveedores.map(p => ({
      id: p.id,
      lng: p.lng,
      lat: p.lat,
      properties: { proveedor: p },
    })),
    [proveedores]
  );

  const clustered = useMarkerClustering(proveedorPoints, viewState.zoom, bounds);

  const deckLayers = useMemo(() => {
    const layers = [];

    // Círculo de radio
    if (centroRadio && radioKm) {
      const polygon = generateCirclePolygon([centroRadio.lng, centroRadio.lat], radioKm);
      layers.push(
        new PolygonLayer({
          id: 'radio-circle',
          data: [{ polygon }],
          getPolygon: (d: { polygon: [number, number][] }) => d.polygon,
          getFillColor: [99, 102, 241, 20],
          getLineColor: [99, 102, 241, 200],
          getLineWidth: 2,
          lineWidthMinPixels: 2,
          filled: true,
          stroked: true,
          pickable: false,
        })
      );

      // Punto central (indigo, igual que referencia)
      layers.push(
        new ScatterplotLayer({
          id: 'center-point',
          data: [{ position: [centroRadio.lng, centroRadio.lat] as [number, number] }],
          getPosition: (d: { position: [number, number] }) => d.position,
          getFillColor: [99, 102, 241, 255],
          getRadius: 80,
          radiusMinPixels: 4,
          radiusMaxPixels: 8,
          stroked: false,
          pickable: false,
        })
      );
    }

    return layers;
  }, [centroRadio, radioKm]);

  const handleMapClick = useCallback(
    (e: { lngLat: { lat: number; lng: number } }) => {
      onMapClick(e.lngLat.lat, e.lngLat.lng);
    },
    [onMapClick]
  );

  return (
    <Map
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      onClick={handleMapClick}
      mapStyle={MAP_STYLE}
      style={{ width: '100%', height: '100%' }}
      cursor="crosshair"
    >
      <DeckGLOverlay layers={deckLayers} />

      {clustered.map(cluster => (
        <ClusterMarker
          key={cluster.id}
          lng={cluster.lng}
          lat={cluster.lat}
          count={cluster.pointCount}
          nombre={
            cluster.pointCount === 1
              ? (cluster.properties?.proveedor as Proveedor | undefined)?.razonSocial
              : undefined
          }
          onClick={
            cluster.pointCount === 1
              ? () => {
                  const p = cluster.properties?.proveedor as Proveedor | undefined;
                  if (p) onProveedorClick(p);
                }
              : undefined
          }
        />
      ))}

      <NavigationControl position="top-right" />
      <ScaleControl position="bottom-right" />
    </Map>
  );
}
