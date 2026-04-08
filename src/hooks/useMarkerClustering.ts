import Supercluster from 'supercluster';
import { useMemo } from 'react';

export interface ClusterInput {
  id: string;
  lng: number;
  lat: number;
  properties?: Record<string, unknown>;
}

export interface ClusterResult {
  id: string;
  lng: number;
  lat: number;
  isCluster: boolean;
  pointCount: number;
  properties?: Record<string, unknown>;
}

export function useMarkerClustering(
  points: ClusterInput[],
  zoom: number,
  bounds: [number, number, number, number] | null
): ClusterResult[] {
  const supercluster = useMemo(() => {
    const index = new Supercluster({
      radius: 60,
      maxZoom: 16,
    });

    const features = points.map(p => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
      properties: { id: p.id, ...p.properties }
    }));

    index.load(features);
    return index;
  }, [points]);

  return useMemo(() => {
    if (!bounds || points.length === 0) return [];

    const clusters = supercluster.getClusters(bounds, Math.floor(zoom));

    return clusters.map(cluster => ({
      id: cluster.properties?.cluster_id?.toString() || cluster.properties?.id || crypto.randomUUID(),
      lng: cluster.geometry.coordinates[0],
      lat: cluster.geometry.coordinates[1],
      isCluster: !!cluster.properties?.cluster,
      pointCount: cluster.properties?.point_count || 1,
      properties: cluster.properties || {}
    }));
  }, [supercluster, bounds, zoom, points.length]);
}
