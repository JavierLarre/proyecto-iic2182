import { supabase } from '@/lib/supabase';

// ── Tipos (columnas de las vistas materializadas mv_oc_*) ────────────────────
export interface OCRegion {
  region: string;
  n_ordenes: number;
  monto_total: number;
}
export interface OCActores {
  region: string;
  n_proveedores: number;
  n_compradores: number;
}
export interface OCEstado {
  region: string;
  estado: string;
  n_ordenes: number;
  monto_total: number;
}
export interface OCMensual {
  region: string;
  mes: string;
  n_ordenes: number;
  monto_total: number;
}
export interface OCTopProveedor {
  rnk: number;
  proveedor_rut: string;
  proveedor_nombre: string;
  proveedor_region: string;
  n_ordenes: number;
  monto_total: number;
}
export interface OCOrden {
  region: string;
  codigo: string;
  nombre: string | null;
  estado_texto: string | null;
  total: number | null;
  fecha_envio: string | null;
  comprador_nombre: string | null;
  comprador_rut: string | null;
  comprador_comuna: string | null;
  proveedor_nombre: string | null;
  proveedor_rut: string | null;
}

export interface DashboardData {
  regiones: OCRegion[];
  actores: OCActores[];
  estado: OCEstado[];
  mensual: OCMensual[];
  topProveedores: OCTopProveedor[];
  ordenes: OCOrden[];
  totalProveedores: number; // distinct proveedores a nivel nacional
}

const num = (v: unknown): number => Number(v) || 0;

export async function getDashboardData(): Promise<DashboardData> {
  const [reg, act, est, men, top, tab, provCount] = await Promise.all([
    supabase.from('mv_oc_region').select('*'),
    supabase.from('mv_oc_region_actores').select('*'),
    supabase.from('mv_oc_estado').select('*'),
    supabase.from('mv_oc_mensual').select('*').order('mes', { ascending: true }),
    supabase.from('mv_oc_top_prov').select('*').order('rnk', { ascending: true }),
    supabase.from('mv_oc_tabla').select('*'),
    supabase.from('mv_oc_prov_global').select('*', { count: 'exact', head: true }),
  ]);

  const firstError = [reg, act, est, men, top, tab, provCount].find((r) => r.error)?.error;
  if (firstError) throw new Error(`Error consultando Supabase: ${firstError.message}`);

  return {
    regiones: (reg.data ?? []).map((r) => ({
      region: r.region,
      n_ordenes: num(r.n_ordenes),
      monto_total: num(r.monto_total),
    })),
    actores: (act.data ?? []).map((r) => ({
      region: r.region,
      n_proveedores: num(r.n_proveedores),
      n_compradores: num(r.n_compradores),
    })),
    estado: (est.data ?? []).map((r) => ({
      region: r.region,
      estado: r.estado,
      n_ordenes: num(r.n_ordenes),
      monto_total: num(r.monto_total),
    })),
    mensual: (men.data ?? []).map((r) => ({
      region: r.region,
      mes: r.mes,
      n_ordenes: num(r.n_ordenes),
      monto_total: num(r.monto_total),
    })),
    topProveedores: (top.data ?? []).map((r) => ({
      rnk: num(r.rnk),
      proveedor_rut: r.proveedor_rut,
      proveedor_nombre: r.proveedor_nombre,
      proveedor_region: r.proveedor_region,
      n_ordenes: num(r.n_ordenes),
      monto_total: num(r.monto_total),
    })),
    ordenes: (tab.data ?? []) as OCOrden[],
    totalProveedores: provCount.count ?? 0,
  };
}

// ── Consultas on-demand sobre las tablas COMPLETAS (vía RPC) ──────────────────
// region: nombre corto del select (ej. "Metropolitana") o null = nacional.
// cod: código de comuna o null.

export interface OcListaResult { rows: OCOrden[]; has_more: boolean; total: number; capped: boolean }

export async function fetchOcLista(opts: {
  region?: string | null; cod?: number | null; q?: string | null;
  sort?: 'recientes' | 'monto' | 'fecha'; limit?: number; offset?: number;
  compradorRut?: string | null; proveedorRut?: string | null;
}): Promise<OcListaResult> {
  const { data, error } = await supabase.rpc('oc_lista', {
    p_region: opts.region ?? null, p_cod: opts.cod ?? null, p_q: opts.q ?? null,
    p_sort: opts.sort ?? 'recientes', p_limit: opts.limit ?? 25, p_offset: opts.offset ?? 0,
    p_comprador_rut: opts.compradorRut ?? null, p_proveedor_rut: opts.proveedorRut ?? null,
  });
  if (error) throw new Error(error.message);
  return (data ?? { rows: [], has_more: false, total: 0, capped: false }) as OcListaResult;
}

export interface OcConcentracion {
  total_monto: number; n_proveedores: number; n_ordenes: number;
  top: { rut: string; nombre: string; n: number; monto: number }[];
}

export async function fetchOcConcentracion(region: string | null, cod: number | null): Promise<OcConcentracion> {
  const { data, error } = await supabase.rpc('oc_concentracion', { p_region: region, p_cod: cod });
  if (error) throw new Error(error.message);
  return (data ?? { total_monto: 0, n_proveedores: 0, n_ordenes: 0, top: [] }) as OcConcentracion;
}

// ── Compradores (organismos) ──────────────────────────────────────────────
export interface OcTopCompradores {
  total_monto: number; n_compradores: number; n_ordenes: number;
  top: { rut: string; nombre: string; n: number; monto: number }[];
}

export async function fetchOcTopCompradores(region: string | null, cod: number | null): Promise<OcTopCompradores> {
  const { data, error } = await supabase.rpc('oc_top_compradores', { p_region: region, p_cod: cod });
  if (error) throw new Error(error.message);
  return (data ?? { total_monto: 0, n_compradores: 0, n_ordenes: 0, top: [] }) as OcTopCompradores;
}

export interface OrganismoPerfil {
  rut: string; nombre: string | null;
  oc: { n_ordenes: number; monto: number; ticket: number };
  lic: { n_total: number; n_publicada: number; n_adjudicada: number; n_desierta: number; tasa_adjudicacion: number };
  top_proveedores: { nombre: string | null; rut: string | null; n: number; monto: number }[];
  top_rubros: { rubro: string; n: number }[];
}

export async function fetchOrganismoPerfil(rut: string): Promise<OrganismoPerfil> {
  const { data, error } = await supabase.rpc('organismo_perfil', { p_rut: rut });
  if (error) throw new Error(error.message);
  return data as OrganismoPerfil;
}
