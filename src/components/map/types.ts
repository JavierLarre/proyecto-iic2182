export interface ClickedPoint {
  lat: number;
  lng: number;
}

export interface Proveedor {
  id: string;
  razonSocial: string;
  rubro: string;
  direccion: string;
  comuna: string;
  region: string;
  lat: number;
  lng: number;
}

export interface FiltrosProveedor {
  rubro: string | null;
  radioKm: number;              // siempre definido, default 5
  centroRadio: ClickedPoint | null; // null = sin círculo
}

export const CHILE_CENTER = {
  latitude: -33.4489,
  longitude: -70.6693,
  zoom: 5
};

export const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export function generateCirclePolygon(
  center: [number, number],
  radiusKm: number,
  points = 64
): [number, number][] {
  const coords: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = radiusKm * Math.cos(angle);
    const dy = radiusKm * Math.sin(angle);
    coords.push([
      center[0] + dx / (111 * Math.cos(center[1] * Math.PI / 180)),
      center[1] + dy / 111
    ]);
  }
  coords.push(coords[0]);
  return coords;
}

export function distanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isPointInsideCircle(
  point: { lat: number; lng: number },
  center: { lat: number; lng: number },
  radiusKm: number
): boolean {
  return distanceKm(point.lat, point.lng, center.lat, center.lng) <= radiusKm;
}
