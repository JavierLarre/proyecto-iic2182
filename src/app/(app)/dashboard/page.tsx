import { getDashboardData, type DashboardData } from '@/lib/data/dashboard';
import { DashboardClient } from './DashboardClient';

// Datos provienen de vistas materializadas (snapshot); re-cachear cada 30 min.
export const revalidate = 1800;

const EMPTY_DASHBOARD: DashboardData = {
  regiones: [], actores: [], estado: [], mensual: [],
  topProveedores: [], ordenes: [], totalProveedores: 0,
};

export default async function DashboardPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; region?: string; comunaCod?: string }> }) {
  const sp = await searchParams;
  const initialCod = sp.comunaCod ? Number(sp.comunaCod) : undefined;
  try {
    const data = await getDashboardData();
    return <DashboardClient data={data} initialRegion={sp.region} initialBusqueda={sp.q} initialCod={initialCod} />;
  } catch {
    return (
      <DashboardClient
        data={EMPTY_DASHBOARD}
        error="No pudimos cargar los datos del mercado. Revisa tu conexión e inténtalo nuevamente."
      />
    );
  }
}
