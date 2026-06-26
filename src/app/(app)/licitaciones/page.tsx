import { getLicitacionesData, type LicitacionesData } from '@/lib/data/licitaciones';
import { LicitacionesClient } from './LicitacionesClient';

export const revalidate = 1800;

const EMPTY_LICITACIONES: LicitacionesData = {
  regiones: [], estado: [], mensual: [], topCompradores: [], licitaciones: [],
};

export default async function LicitacionesPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; region?: string; comunaCod?: string; compradorRut?: string; compradorNombre?: string }> }) {
  const sp = await searchParams;
  const initialCod = sp.comunaCod ? Number(sp.comunaCod) : undefined;
  try {
    const data = await getLicitacionesData();
    return <LicitacionesClient data={data} initialRegion={sp.region} initialBusqueda={sp.q} initialCod={initialCod}
      initialCompradorRut={sp.compradorRut} initialCompradorNombre={sp.compradorNombre} />;
  } catch {
    return (
      <LicitacionesClient
        data={EMPTY_LICITACIONES}
        error="No pudimos cargar las licitaciones. Revisa tu conexión e inténtalo nuevamente."
      />
    );
  }
}
