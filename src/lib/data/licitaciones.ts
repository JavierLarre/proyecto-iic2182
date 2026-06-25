import { supabase } from '@/lib/supabase';

// ── Tipos (columnas de las vistas materializadas mv_lic_*) ───────────────────
export interface LicRegion {
  region: string;
  n_total: number;
  n_con_monto: number;
  monto_total: number;
  n_adjudicada: number;
  n_publicada: number;
  n_desierta: number;
}
export interface LicEstado {
  region: string;
  estado: string;
  n_total: number;
  monto_total: number;
}
export interface LicMensual {
  region: string;
  mes: string;
  n_total: number;
  monto_total: number;
}
export interface LicTopComprador {
  rnk: number;
  region: string;
  comprador_rut: string;
  comprador_nombre: string;
  n_licitaciones: number;
  monto_total: number;
}
export interface Licitacion {
  region: string;
  codigo_externo: string;
  nombre: string | null;
  estado_texto: string | null;
  tipo_licitacion: string | null;
  monto_estimado: number | null;
  unidad_monetaria: string | null;
  fecha_publicacion: string | null;
  fecha_cierre: string | null;
  fecha_adjudicacion: string | null;
  comprador_nombre: string | null;
  comprador_comuna: string | null;
}

export interface LicitacionesData {
  regiones: LicRegion[];
  estado: LicEstado[];
  mensual: LicMensual[];
  topCompradores: LicTopComprador[];
  licitaciones: Licitacion[];
}

const num = (v: unknown): number => Number(v) || 0;

export async function getLicitacionesData(): Promise<LicitacionesData> {
  const [reg, est, men, top, tab] = await Promise.all([
    supabase.from('mv_lic_region').select('*'),
    supabase.from('mv_lic_estado').select('*'),
    supabase.from('mv_lic_mensual').select('*').order('mes', { ascending: true }),
    supabase.from('mv_lic_top_comprador').select('*').order('rnk', { ascending: true }),
    supabase.from('mv_lic_tabla').select('*'),
  ]);

  const firstError = [reg, est, men, top, tab].find((r) => r.error)?.error;
  if (firstError) throw new Error(`Error consultando Supabase: ${firstError.message}`);

  return {
    regiones: (reg.data ?? []).map((r) => ({
      region: r.region,
      n_total: num(r.n_total),
      n_con_monto: num(r.n_con_monto),
      monto_total: num(r.monto_total),
      n_adjudicada: num(r.n_adjudicada),
      n_publicada: num(r.n_publicada),
      n_desierta: num(r.n_desierta),
    })),
    estado: (est.data ?? []).map((r) => ({
      region: r.region,
      estado: r.estado,
      n_total: num(r.n_total),
      monto_total: num(r.monto_total),
    })),
    mensual: (men.data ?? []).map((r) => ({
      region: r.region,
      mes: r.mes,
      n_total: num(r.n_total),
      monto_total: num(r.monto_total),
    })),
    topCompradores: (top.data ?? []).map((r) => ({
      rnk: num(r.rnk),
      region: r.region,
      comprador_rut: r.comprador_rut,
      comprador_nombre: r.comprador_nombre,
      n_licitaciones: num(r.n_licitaciones),
      monto_total: num(r.monto_total),
    })),
    licitaciones: (tab.data ?? []) as Licitacion[],
  };
}

// ── Consultas on-demand sobre la tabla COMPLETA (vía RPC) ─────────────────────

export interface LicListaResult { rows: Licitacion[]; has_more: boolean }

export async function fetchLicLista(opts: {
  region?: string | null; cod?: number | null; estado?: string | null; tipo?: string | null;
  q?: string | null; sort?: 'recientes' | 'cierre' | 'monto'; limit?: number; offset?: number;
}): Promise<LicListaResult> {
  const { data, error } = await supabase.rpc('lic_lista', {
    p_region: opts.region ?? null, p_cod: opts.cod ?? null, p_estado: opts.estado ?? null,
    p_tipo: opts.tipo ?? null, p_q: opts.q ?? null, p_sort: opts.sort ?? 'recientes',
    p_limit: opts.limit ?? 25, p_offset: opts.offset ?? 0,
  });
  if (error) throw new Error(error.message);
  return (data ?? { rows: [], has_more: false }) as LicListaResult;
}

export interface LicResumen { n_total: number; n_publicada: number; n_adjudicada: number; n_desierta: number; monto: number }

export async function fetchLicResumen(region: string | null, cod: number | null): Promise<LicResumen> {
  const { data, error } = await supabase.rpc('lic_resumen', { p_region: region, p_cod: cod });
  if (error) throw new Error(error.message);
  return (data ?? { n_total: 0, n_publicada: 0, n_adjudicada: 0, n_desierta: 0, monto: 0 }) as LicResumen;
}
