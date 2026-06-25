import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['maplibre-gl', 'react-map-gl', '@deck.gl/core', '@deck.gl/layers', '@deck.gl/mapbox'],
};

export default nextConfig;
