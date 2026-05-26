import { getComunaChoropleth } from '@/lib/data/mapa';
import { ComunaMapLoader } from '@/components/map/ComunaMapLoader';

export const revalidate = 1800;

export default async function MapaPage() {
  const choropleth = await getComunaChoropleth();
  return <ComunaMapLoader choropleth={choropleth} />;
}
