// Combina los 16 GeoJSON de comunas (1 por región, caracena/chile-geojson),
// los simplifica con mapshaper (topológico → bordes compartidos consistentes,
// sin huecos) y deja public/comunas-chile.geojson para el choropleth del mapa.
//
// Uso:  node scripts/build-comunas-geojson.mjs

import fs from 'node:fs';
import { execSync } from 'node:child_process';

const BASE = 'https://raw.githubusercontent.com/caracena/chile-geojson/master';

// 1) Asegurar archivos por región y combinarlos en una FeatureCollection.
const features = [];
for (let r = 1; r <= 16; r++) {
  const p = `/tmp/r${r}.geojson`;
  if (!fs.existsSync(p)) execSync(`curl -s --max-time 60 -o ${p} "${BASE}/${r}.geojson"`);
  const gj = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const f of gj.features) features.push(f);
}
fs.writeFileSync('/tmp/comunas-all.geojson', JSON.stringify({ type: 'FeatureCollection', features }));
console.log(`combinadas ${features.length} comunas`);

// 2) mapshaper: conservar solo campos útiles, simplificar (topológico) y limpiar.
fs.mkdirSync('public', { recursive: true });
const cmd = [
  'node_modules/.bin/mapshaper',
  '/tmp/comunas-all.geojson',
  '-filter-fields cod_comuna,Comuna,Provincia,codregion',
  '-simplify 7% keep-shapes',
  '-clean',
  '-o format=geojson precision=0.0001 public/comunas-chile.geojson',
].join(' ');
execSync(cmd, { stdio: 'inherit' });

const sizeKB = Math.round(fs.statSync('public/comunas-chile.geojson').size / 1024);
console.log(`OK: public/comunas-chile.geojson (${sizeKB} KB)`);
