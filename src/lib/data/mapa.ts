import { supabase } from '@/lib/supabase';

const num = (v: unknown): number => Number(v) || 0;

// ── Choropleth: métricas por comuna (para colorear las teselas) ───────────────
export interface ComunaMetricas {
  cod: number;
  nOrdenes: number;
  montoOC: number;
  nLicitaciones: number;
  montoLic: number;
  nAdjudicadas: number;
}

export async function getComunaChoropleth(): Promise<Record<number, ComunaMetricas>> {
  const [oc, lic] = await Promise.all([
    supabase.from('mv_oc_comuna').select('*'),
    supabase.from('mv_lic_comuna').select('*'),
  ]);
  if (oc.error) throw new Error(oc.error.message);
  if (lic.error) throw new Error(lic.error.message);

  const map: Record<number, ComunaMetricas> = {};
  for (const r of oc.data ?? []) {
    map[r.cod] = {
      cod: r.cod,
      nOrdenes: num(r.n_ordenes),
      montoOC: num(r.monto_total),
      nLicitaciones: 0,
      montoLic: 0,
      nAdjudicadas: 0,
    };
  }
  for (const r of lic.data ?? []) {
    const m = map[r.cod] ?? { cod: r.cod, nOrdenes: 0, montoOC: 0, nLicitaciones: 0, montoLic: 0, nAdjudicadas: 0 };
    m.nLicitaciones = num(r.n_licitaciones);
    m.montoLic = num(r.monto_total);
    m.nAdjudicadas = num(r.n_adjudicadas);
    map[r.cod] = m;
  }
  return map;
}

// ── Detalle de comuna (vía RPC, on-demand al hacer clic) ──────────────────────
export interface ComunaResumen {
  cod: number;
  sin_datos?: boolean;
  resumen: { n_ordenes: number; monto_total: number; n_proveedores: number; n_organismos: number; ticket: number };
  lic: { n_licitaciones: number; monto: number; n_adjudicadas: number; n_publicadas: number; n_desierta: number };
  estado_oc: { estado: string; n: number; monto: number }[];
  mensual_oc: { mes: string; n: number; monto: number }[];
}

export interface ProvOrg { nombre: string | null; rut: string | null; n: number; monto: number }
export interface OrdenReciente { codigo: string; nombre: string | null; estado: string | null; total: number | null; fecha_envio: string | null; proveedor_nombre: string | null }
export interface LicReciente { codigo: string; nombre: string | null; estado: string | null; tipo: string | null; monto_estimado: number | null; unidad_monetaria: string | null; fecha_publicacion: string | null; fecha_cierre: string | null }
export interface ComunaListas {
  sin_datos?: boolean;
  top_proveedores: ProvOrg[];
  top_organismos: ProvOrg[];
  ordenes_recientes: OrdenReciente[];
  licitaciones_recientes: LicReciente[];
}

export async function getComunaResumen(cod: number): Promise<ComunaResumen> {
  const { data, error } = await supabase.rpc('comuna_resumen', { p_cod: cod });
  if (error) throw new Error(error.message);
  return data as ComunaResumen;
}

export async function getComunaListas(cod: number): Promise<ComunaListas> {
  const { data, error } = await supabase.rpc('comuna_listas', { p_cod: cod });
  if (error) throw new Error(error.message);
  return data as ComunaListas;
}
