'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAutoHideHeader } from '@/lib/useAutoHideHeader';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line,
} from 'recharts';
import {
  Search, TrendingUp, Users, Building2, Receipt,
  Copy, Calendar, MapPin, FileText, AlertTriangle, RotateCw, Trophy, Crown, ChevronRight, Swords,
  ChevronLeft, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardBody, CardFooter, Input, DetailDrawer, Skeleton } from '@/components/ui';
import { fmtCLP, fmtCLPFull, fmtInt, fmtMesCorto, fmtFecha } from '@/lib/format';
import {
  type DashboardData, type OCOrden,
  fetchOcLista, fetchOcConcentracion, type OcListaResult,
} from '@/lib/data/dashboard';
import { fetchComunasRef, type ComunaRef } from '@/lib/data/comunas';

const ESTADO_COLOR: Record<string, string> = {
  'Recepción Conforme': '#6DCFB0', 'Aceptada': '#5B8FE8', 'Enviada a Proveedor': '#7EC8E3',
  'En proceso': '#F0A857', 'Cancelada': '#E07C7C', 'No aceptada': '#A78BDB', '(sin estado)': '#D4D4D4',
};
const VIZ = ['#5B8FE8', '#A78BDB', '#7EC8E3', '#6DCFB0', '#F0A857', '#E07C7C', '#49C5EF'];
const billones = (v: number) => `$${(v / 1e12).toLocaleString('es-CL', { maximumFractionDigits: 1 })}B`;

type SortOC = 'recientes' | 'monto' | 'fecha';
type Metric = 'cantidad' | 'monto';
const TODAS = '__TODAS__';
const PAGE = 12;

/** Item unificado para el leaderboard (nacional o scoped). */
interface LBItem { rnk: number; rut: string; nombre: string; region: string | null; n: number; monto: number }

export function DashboardClient({
  data, error, initialRegion, initialBusqueda, initialCod,
}: { data: DashboardData; error?: string; initialRegion?: string; initialBusqueda?: string; initialCod?: number }) {
  const [region, setRegion] = useState<string>(initialRegion ?? TODAS);
  const [cod, setCod] = useState<number | null>(initialCod ?? null);
  const [busqueda, setBusqueda] = useState(initialBusqueda ?? '');
  const [sort, setSort] = useState<SortOC>('recientes');
  const [page, setPage] = useState(0);
  const [metrica, setMetrica] = useState<Metric>('monto');

  const [comunas, setComunas] = useState<ComunaRef[]>([]);
  const [lista, setLista] = useState<OcListaResult | null>(null);
  const [loadingLista, setLoadingLista] = useState(true);
  const [conc, setConc] = useState<import('@/lib/data/dashboard').OcConcentracion | null>(null);
  const [loadingConc, setLoadingConc] = useState(false);

  const [selected, setSelected] = useState<OCOrden | null>(null);
  const [selectedProv, setSelectedProv] = useState<LBItem | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const headerVisible = useAutoHideHeader(scrollRef, 'scroll');

  const regionParam = region === TODAS ? null : region;
  const scoped = regionParam !== null || cod !== null;

  // ── Catálogo de comunas (cascada) ────────────────────────────────────────
  useEffect(() => { fetchComunasRef().then(setComunas).catch(() => setComunas([])); }, []);
  const comunaOpts = useMemo(
    () => comunas.filter((c) => region === TODAS || c.region === region).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [comunas, region],
  );
  const comunaNombre = useMemo(() => comunas.find((c) => c.cod === cod)?.nombre ?? '', [comunas, cod]);
  const scopeLabel = !scoped ? 'nacional' : cod != null ? (comunaNombre || 'comuna') : region;

  // ── Debounce búsqueda + reset de página al cambiar filtros ───────────────
  const [qDebounced, setQDebounced] = useState(busqueda);
  useEffect(() => { const t = setTimeout(() => setQDebounced(busqueda), 350); return () => clearTimeout(t); }, [busqueda]);
  useEffect(() => { setPage(0); }, [qDebounced, region, cod, sort]);

  // ── Fetch lista (siempre, datos reales paginados) ────────────────────────
  useEffect(() => {
    let alive = true; setLoadingLista(true);
    fetchOcLista({ region: regionParam, cod, q: qDebounced || null, sort, limit: PAGE, offset: page * PAGE })
      .then((r) => { if (alive) { setLista(r); setLoadingLista(false); } })
      .catch(() => { if (alive) { setLista({ rows: [], has_more: false }); setLoadingLista(false); } });
    return () => { alive = false; };
  }, [regionParam, cod, qDebounced, sort, page]);

  // ── Fetch concentración scoped (solo si hay filtro) ──────────────────────
  useEffect(() => {
    if (!scoped) { setConc(null); return; }
    let alive = true; setLoadingConc(true);
    fetchOcConcentracion(regionParam, cod)
      .then((c) => { if (alive) { setConc(c); setLoadingConc(false); } })
      .catch(() => { if (alive) { setConc(null); setLoadingConc(false); } });
    return () => { alive = false; };
  }, [regionParam, cod, scoped]);

  // ── Vista de concentración: nacional (MV) o scoped (RPC) ─────────────────
  const nationalMonto = useMemo(() => data.regiones.reduce((s, r) => s + r.monto_total, 0), [data.regiones]);
  const nationalOrdenes = useMemo(() => data.regiones.reduce((s, r) => s + r.n_ordenes, 0), [data.regiones]);

  const concView = useMemo(() => {
    const build = (total: number, nOrd: number, nProv: number, lb: LBItem[]) => {
      const share = (arr: LBItem[]) => (total ? (arr.reduce((s, p) => s + p.monto, 0) / total) * 100 : 0);
      const top1 = share(lb.slice(0, 1)), top2_3 = share(lb.slice(1, 3)), top4_10 = share(lb.slice(3, 10));
      const top10 = top1 + top2_3 + top4_10;
      return {
        top1, top2_3, top4_10, top10, resto: Math.max(0, 100 - top10),
        nivel: top10 >= 40 ? 'Concentrado' : top10 >= 20 ? 'Equilibrado' : 'Fragmentado',
        total_monto: total, n_prov: nProv, ticket: nOrd ? total / nOrd : 0, leaderboard: lb,
      };
    };
    if (scoped) {
      if (!conc) return null; // cargando
      const lb: LBItem[] = conc.top.map((p, i) => ({ rnk: i + 1, rut: p.rut, nombre: p.nombre, region: null, n: p.n, monto: p.monto }));
      return build(conc.total_monto, conc.n_ordenes, conc.n_proveedores, lb);
    }
    const lb: LBItem[] = data.topProveedores.map((p) => ({
      rnk: p.rnk, rut: p.proveedor_rut, nombre: p.proveedor_nombre, region: p.proveedor_region, n: p.n_ordenes, monto: p.monto_total,
    }));
    return build(nationalMonto, nationalOrdenes, data.totalProveedores, lb);
  }, [scoped, conc, data.topProveedores, data.totalProveedores, nationalMonto, nationalOrdenes]);

  // Competencia por región (siempre nacional, comparativa)
  const competenciaRegional = useMemo(() => data.regiones.map((r) => {
    const a = data.actores.find((x) => x.region === r.region);
    const nProv = a?.n_proveedores ?? 0;
    return { region: r.region, nProv, monto: r.monto_total, montoPorProv: nProv ? r.monto_total / nProv : 0 };
  }).sort((x, y) => y.montoPorProv - x.montoPorProv), [data.regiones, data.actores]);

  // Charts del análisis colapsable (nacional o por región del select)
  const regionesOrdenadas = useMemo(() => [...data.regiones].sort((a, b) => b.monto_total - a.monto_total), [data.regiones]);
  const estadoData = useMemo(() => {
    const rows = region === TODAS ? data.estado : data.estado.filter((e) => e.region === region);
    const map: Record<string, number> = {};
    for (const e of rows) map[e.estado] = (map[e.estado] ?? 0) + e.n_ordenes;
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map).map(([estado, n]) => ({ estado, n, pct: total ? Math.round((n / total) * 100) : 0 })).sort((a, b) => b.n - a.n);
  }, [region, data.estado]);
  const mensualData = useMemo(() => {
    const rows = region === TODAS ? data.mensual : data.mensual.filter((m) => m.region === region);
    const map: Record<string, { n: number; monto: number }> = {};
    for (const m of rows) { if (!map[m.mes]) map[m.mes] = { n: 0, monto: 0 }; map[m.mes].n += m.n_ordenes; map[m.mes].monto += m.monto_total; }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-18).map(([mes, v]) => ({ mes: fmtMesCorto(mes), cantidad: v.n, monto: v.monto }));
  }, [region, data.mensual]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* Header + filtros (sticky, auto-ocultable al hacer scroll) */}
        <div className={cn(
          'sticky top-0 z-30 bg-surface border-b border-borders px-6 py-4 transition-transform duration-300 ease-in-out motion-reduce:transition-none',
          headerVisible ? 'translate-y-0' : '-translate-y-full',
        )}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-h3 font-semibold text-app-text">Órdenes de compra</h1>
              <p className="text-label text-app-text/50 mt-0.5">
                Inteligencia competitiva · ¿quién le vende al Estado y cuán concentrado está el mercado?
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={region} onChange={(e) => { setRegion(e.target.value); setCod(null); }} aria-label="Filtrar por región"
                className="text-sm bg-surface text-app-text border border-borders rounded-[6px] px-3 py-1.5 focus:outline-none focus:border-2 focus:border-primary transition-colors cursor-pointer">
                <option value={TODAS}>Todas las regiones</option>
                {regionesOrdenadas.map((r) => (<option key={r.region} value={r.region}>{r.region}</option>))}
              </select>
              <select value={cod ?? ''} onChange={(e) => setCod(e.target.value ? Number(e.target.value) : null)} aria-label="Filtrar por comuna"
                disabled={comunaOpts.length === 0}
                className="text-sm bg-surface text-app-text border border-borders rounded-[6px] px-3 py-1.5 max-w-[200px] focus:outline-none focus:border-2 focus:border-primary transition-colors cursor-pointer disabled:opacity-50">
                <option value="">{region === TODAS ? 'Todas las comunas' : 'Toda la región'}</option>
                {comunaOpts.map((c) => (<option key={c.cod} value={c.cod}>{c.nombre}</option>))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 max-w-[1400px] mx-auto">

          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-[8px] border border-error/40 bg-error/10 px-4 py-3">
              <AlertTriangle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-sm font-medium text-app-text">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                  <RotateCw className="h-3.5 w-3.5" /> Reintentar
                </button>
              </div>
            </div>
          )}

          {/* ── HERO: termómetro de concentración (scoped) ──────────────── */}
          {scoped && loadingConc && !concView ? (
            <Card><CardBody className="space-y-3"><Skeleton className="h-7 w-80" /><Skeleton className="h-6 w-full" /><div className="grid grid-cols-3 gap-3"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div></CardBody></Card>
          ) : concView && (
            <ConcentracionHero c={concView} scopeLabel={scopeLabel} />
          )}

          {/* ── Leaderboard + competencia por región (lado a lado) ──────── */}
          <div className={cn('grid gap-4', cod ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2')}>
            {concView && (
              <Leaderboard rows={concView.leaderboard} montoTotal={concView.total_monto} scopeLabel={scopeLabel} onSelect={setSelectedProv} />
            )}
            {!cod && <CompetenciaRegional filas={competenciaRegional} regionSel={region} />}
          </div>

          {/* ── Evidencia: órdenes (datos reales paginados) ─────────────── */}
          <Card>
            <CardHeader className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-app-text/40" strokeWidth={1.5} />
                <span className="text-sm font-medium text-app-text">Órdenes · {scopeLabel}</span>
                {loadingLista && <Loader2 className="h-3.5 w-3.5 animate-spin text-app-text/40" />}
              </div>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-app-text/30 pointer-events-none" strokeWidth={1.5} />
                <Input type="text" aria-label="Buscar órdenes por proveedor, organismo o descripción" placeholder="Buscar proveedor, organismo…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-8 text-sm py-1.5" />
              </div>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortOC)} aria-label="Ordenar órdenes"
                className="text-sm bg-surface text-app-text border border-borders rounded-[6px] px-2 py-1.5 focus:outline-none focus:border-2 focus:border-primary cursor-pointer">
                <option value="recientes">Más recientes</option>
                <option value="monto">Mayor monto</option>
                <option value="fecha">Fecha de envío</option>
              </select>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-borders bg-background">
                    <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-app-text/50 uppercase tracking-wide">Código</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-app-text/50 uppercase tracking-wide">Proveedor</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-app-text/50 uppercase tracking-wide">Organismo</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-app-text/50 uppercase tracking-wide">Descripción</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-app-text/50 uppercase tracking-wide">Estado</th>
                    <th scope="col" className="px-4 py-2.5 text-right text-xs font-medium text-app-text/50 uppercase tracking-wide">Monto</th>
                    <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-app-text/50 uppercase tracking-wide">Envío</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borders/30">
                  {loadingLista ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}><td colSpan={7} className="px-4 py-2"><Skeleton className="h-6 w-full" /></td></tr>
                    ))
                  ) : (lista?.rows.length ?? 0) === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-app-text/40">No hay órdenes para este filtro.</td></tr>
                  ) : (
                    lista!.rows.map((o) => (
                      <tr key={o.codigo}
                        onClick={() => setSelected(o)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(o); } }}
                        tabIndex={0} role="button" aria-label={`Ver detalle de la orden ${o.codigo}`}
                        className="cursor-pointer hover:bg-background transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
                        <td className="px-4 py-2.5 text-xs text-app-text/40 font-mono whitespace-nowrap">{o.codigo}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap max-w-[200px]">
                          <div className="font-medium text-app-text truncate">{o.proveedor_nombre ?? '—'}</div>
                          <div className="text-xs text-app-text/40">{o.proveedor_rut}</div>
                        </td>
                        <td className="px-4 py-2.5 text-app-text/60 text-xs whitespace-nowrap max-w-[160px]"><span className="truncate block">{o.comprador_nombre ?? '—'}</span></td>
                        <td className="px-4 py-2.5 text-app-text/70 max-w-[240px]"><span className="line-clamp-2 text-xs leading-snug">{o.nombre ?? '—'}</span></td>
                        <td className="px-4 py-2.5"><EstadoBadge estado={o.estado_texto} /></td>
                        <td className="px-4 py-2.5 text-right font-medium text-app-text whitespace-nowrap">{o.total != null ? fmtCLP(o.total) : '—'}</td>
                        <td className="px-4 py-2.5 text-app-text/50 text-xs whitespace-nowrap">{fmtFecha(o.fecha_envio)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pager page={page} hasMore={lista?.has_more ?? false} onPage={setPage} loading={loadingLista} />
          </Card>

          {/* ── Análisis del mercado (colapsable) ───────────────────────── */}
          <details className="group bg-surface border border-borders rounded-[8px]">
            <summary className="flex items-center gap-2 cursor-pointer select-none px-4 py-3 text-sm font-medium text-app-text">
              <ChevronRight className="h-4 w-4 text-app-text/40 transition-transform group-open:rotate-90" />
              Análisis del mercado · estados y tendencia
              <span className="text-label text-app-text/40 font-normal ml-1">(nacional / por región)</span>
            </summary>
            <div className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-background rounded-[8px] p-4">
                  <p className="text-sm font-medium text-app-text mb-2">Monto transado por región</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={regionesOrdenadas} margin={{ top: 4, right: 8, left: 4, bottom: 56 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#D4D4D4" vertical={false} />
                      <XAxis dataKey="region" tick={{ fontSize: 9, fill: '#24242480' }} tickLine={false} angle={-40} textAnchor="end" interval={0} height={60} />
                      <YAxis tick={{ fontSize: 10, fill: '#24242480' }} tickLine={false} axisLine={false} tickFormatter={billones} width={48} />
                      <ChartTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #D4D4D4', background: '#FAFAFA' }} formatter={(v) => [fmtCLPFull(Number(v)), 'Monto']} />
                      <Bar dataKey="monto_total" radius={[4, 4, 0, 0]}>
                        {regionesOrdenadas.map((entry) => (<Cell key={entry.region} fill={region !== TODAS && entry.region !== region ? '#D4D4D4' : '#49C5EF'} opacity={region !== TODAS && entry.region !== region ? 0.5 : 1} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-background rounded-[8px] p-4">
                  <p className="text-sm font-medium text-app-text mb-2 capitalize">Estado de las órdenes · {region === TODAS ? 'nacional' : region}</p>
                  <ResponsiveContainer width="100%" height={216}>
                    <PieChart>
                      <Pie data={estadoData} dataKey="n" nameKey="estado" cx="50%" cy="45%" outerRadius={72} innerRadius={38}>
                        {estadoData.map((e, i) => (<Cell key={e.estado} fill={ESTADO_COLOR[e.estado] ?? VIZ[i % VIZ.length]} />))}
                      </Pie>
                      <ChartTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #D4D4D4', background: '#FAFAFA' }} formatter={(v) => [fmtInt(Number(v)), 'Órdenes']} />
                      <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} formatter={(value, entry) => `${value} (${(entry?.payload as { pct?: number })?.pct ?? 0}%)`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-background rounded-[8px] p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-app-text">Tendencia mensual · <span className="capitalize">{region === TODAS ? 'nacional' : region}</span></p>
                  <div className="flex items-center gap-1 bg-surface rounded-[6px] p-1">
                    {(['monto', 'cantidad'] as Metric[]).map((m) => (
                      <button key={m} onClick={() => setMetrica(m)} className={cn('text-xs px-2.5 py-1 rounded-[4px] transition-colors', metrica === m ? 'bg-background shadow-sm font-medium text-app-text' : 'text-app-text/50 hover:text-app-text')}>
                        {m === 'monto' ? 'Monto' : 'Cantidad'}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={mensualData} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D4D4D4" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#24242480' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#24242480' }} tickLine={false} axisLine={false} width={52} tickFormatter={(v) => (metrica === 'monto' ? billones(Number(v)) : fmtInt(Number(v)))} />
                    <ChartTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #D4D4D4', background: '#FAFAFA' }} formatter={(v) => metrica === 'monto' ? [fmtCLPFull(Number(v)), 'Monto'] : [fmtInt(Number(v)), 'Órdenes']} />
                    <Line type="monotone" dataKey={metrica} stroke="#49C5EF" strokeWidth={2} dot={{ r: 2.5, fill: '#49C5EF' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Drawer proveedor */}
      <DetailDrawer open={selectedProv !== null} onClose={() => setSelectedProv(null)}
        title={selectedProv?.nombre ?? 'Proveedor'} subtitle={selectedProv ? `#${selectedProv.rnk} · ${selectedProv.rut}` : undefined}>
        {selectedProv && concView && (
          <ProveedorDetalle prov={selectedProv} montoTotal={concView.total_monto} scopeLabel={scopeLabel}
            onVerOrdenes={(nombre) => { setBusqueda(nombre); setSelectedProv(null); toast.success('Mostrando sus órdenes'); }} />
        )}
      </DetailDrawer>

      {/* Drawer orden */}
      <DetailDrawer open={selected !== null} onClose={() => setSelected(null)}
        title={selected?.proveedor_nombre ?? selected?.codigo ?? 'Orden de compra'} subtitle={selected?.codigo}>
        {selected && <OrdenDetalle orden={selected} onBuscarProveedor={(nombre) => { setBusqueda(nombre); setSelected(null); toast.success('Filtrando por proveedor'); }} />}
      </DetailDrawer>
    </div>
  );
}

/* ── Paginación (por has_more, sin count total) ─────────────────────────── */
function Pager({ page, hasMore, onPage, loading }: { page: number; hasMore: boolean; onPage: (p: number) => void; loading: boolean }) {
  return (
    <CardFooter className="flex items-center justify-end gap-2 text-xs text-app-text/50">
      <button onClick={() => onPage(Math.max(0, page - 1))} disabled={page <= 0 || loading}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] border border-borders hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft className="h-3.5 w-3.5" /> Anterior
      </button>
      <span className="tabular-nums" aria-live="polite">Página {page + 1}</span>
      <button onClick={() => onPage(page + 1)} disabled={!hasMore || loading}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] border border-borders hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        Siguiente <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </CardFooter>
  );
}

/* ── HERO: termómetro de concentración ──────────────────────────────────── */
function ConcentracionHero({ c, scopeLabel }: {
  c: { top1: number; top2_3: number; top4_10: number; top10: number; resto: number; nivel: string; total_monto: number; n_prov: number; ticket: number };
  scopeLabel: string;
}) {
  const nivelColor = c.nivel === 'Concentrado' ? 'text-error bg-error/10' : c.nivel === 'Equilibrado' ? 'text-warning bg-warning/10' : 'text-success bg-success/10';
  const segs = [
    { label: 'Líder', pct: c.top1, color: '#1B8FB5' },
    { label: '2.º–3.º', pct: c.top2_3, color: '#49C5EF' },
    { label: '4.º–10.º', pct: c.top4_10, color: '#7EC8E3' },
    { label: 'Resto del mercado', pct: c.resto, color: '#D4D4D4' },
  ];
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Swords className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-label text-app-text/50 capitalize">Concentración del mercado · {scopeLabel}</p>
              <p className="text-2xl font-bold text-app-text leading-tight">
                Los 10 mayores concentran <span className="text-primary">{c.top10.toFixed(1)}%</span> del monto
              </p>
            </div>
          </div>
          <span className={cn('text-xs font-semibold px-3 py-1 rounded-full self-center', nivelColor)}>Mercado {c.nivel.toLowerCase()}</span>
        </div>
        <div>
          <div className="flex h-6 w-full overflow-hidden rounded-[6px] border border-borders">
            {segs.map((s) => s.pct > 0 && (<div key={s.label} style={{ width: `${s.pct}%`, background: s.color }} className="h-full" title={`${s.label}: ${s.pct.toFixed(1)}%`} />))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {segs.map((s) => (<span key={s.label} className="inline-flex items-center gap-1.5 text-xs text-app-text/60"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />{s.label} · {s.pct.toFixed(1)}%</span>))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-1">
          <MiniStat label="Monto transado" value={fmtCLP(c.total_monto)} />
          <MiniStat label="Proveedores" value={fmtInt(c.n_prov)} />
          <MiniStat label="Ticket promedio" value={fmtCLP(c.ticket)} />
        </div>
      </CardBody>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background rounded-[8px] px-3 py-2">
      <p className="text-label text-app-text/40">{label}</p>
      <p className="text-base font-bold text-app-text mt-0.5 truncate">{value}</p>
    </div>
  );
}

/* ── ESTRELLA: leaderboard ──────────────────────────────────────────────── */
function Leaderboard({ rows, montoTotal, scopeLabel, onSelect }: { rows: LBItem[]; montoTotal: number; scopeLabel: string; onSelect: (p: LBItem) => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <Trophy className="h-4 w-4 text-warning" strokeWidth={1.5} />
          <span className="text-sm font-medium text-app-text">Quién domina el mercado</span>
          <span className="text-label text-app-text/40 ml-1 capitalize">{scopeLabel} · clic para ver detalle</span>
        </div>
      </CardHeader>
      <CardBody className="space-y-1.5 max-h-[440px] overflow-y-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-app-text/40 py-6 text-center">Sin proveedores para este filtro.</p>
        ) : rows.slice(0, 10).map((p) => {
          const pct = montoTotal ? (p.monto / montoTotal) * 100 : 0;
          const ticket = p.n ? p.monto / p.n : 0;
          const podium = p.rnk <= 3;
          return (
            <button key={p.rut} onClick={() => onSelect(p)}
              className="w-full text-left flex items-center gap-3 rounded-[8px] px-2 py-2 hover:bg-background transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold flex-shrink-0',
                p.rnk === 1 ? 'bg-warning/20 text-warning' : podium ? 'bg-primary/15 text-primary' : 'bg-borders/50 text-app-text/50')}>
                {p.rnk === 1 ? <Crown className="h-3.5 w-3.5" /> : p.rnk}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-app-text truncate">{p.nombre}</span>
                  <span className="text-xs text-app-text/50 flex-shrink-0">{fmtCLP(p.monto)} · {pct.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-borders/40 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${Math.min(pct * 4, 100)}%` }} /></div>
                  <span className="text-xs text-app-text/40 flex-shrink-0 w-32 text-right truncate">{fmtInt(p.n)} OC · tkt {fmtCLP(ticket)}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-app-text/30 flex-shrink-0" />
            </button>
          );
        })}
      </CardBody>
    </Card>
  );
}

function ProveedorDetalle({ prov, montoTotal, scopeLabel, onVerOrdenes }: { prov: LBItem; montoTotal: number; scopeLabel: string; onVerOrdenes: (nombre: string) => void }) {
  const pct = montoTotal ? (prov.monto / montoTotal) * 100 : 0;
  const ticket = prov.n ? prov.monto / prov.n : 0;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-warning/15 text-warning capitalize"><Trophy className="h-3.5 w-3.5" /> #{prov.rnk} · {scopeLabel}</span>
        <span className="text-xs text-app-text/50 font-mono">{prov.rut}</span>
      </div>
      <div className="rounded-[8px] bg-background px-4 py-3">
        <p className="text-label text-app-text/40 capitalize">Cuota de mercado · {scopeLabel}</p>
        <p className="text-2xl font-bold text-primary mt-0.5">{pct.toFixed(2)}%</p>
        <p className="text-xs text-app-text/50 mt-0.5">{fmtCLPFull(prov.monto)} en órdenes</p>
      </div>
      <dl className="space-y-3">
        {prov.region && <DetalleItem icon={<MapPin className="h-4 w-4" strokeWidth={1.5} />} label="Región base" value={prov.region} />}
        <DetalleItem icon={<Receipt className="h-4 w-4" strokeWidth={1.5} />} label="Órdenes ganadas" value={fmtInt(prov.n)} />
        <DetalleItem icon={<TrendingUp className="h-4 w-4" strokeWidth={1.5} />} label="Ticket promedio" value={fmtCLP(ticket)} />
      </dl>
      <div className="flex flex-col gap-2 pt-2 border-t border-borders">
        <button onClick={() => { navigator.clipboard?.writeText(prov.rut); toast.success('RUT copiado'); }}
          className="flex items-center justify-center gap-2 rounded-[8px] border border-borders bg-surface px-4 py-2 text-sm font-medium text-app-text hover:bg-background transition-colors">
          <Copy className="h-4 w-4" strokeWidth={1.5} /> Copiar RUT
        </button>
        <button onClick={() => onVerOrdenes(prov.nombre)}
          className="flex items-center justify-center gap-2 rounded-[8px] bg-primary px-4 py-2 text-sm font-medium text-surface hover:bg-primary-hover transition-colors">
          <FileText className="h-4 w-4" strokeWidth={1.5} /> Ver sus órdenes
        </button>
      </div>
    </div>
  );
}

/* ── Competencia por región ─────────────────────────────────────────────── */
function CompetenciaRegional({ filas, regionSel }: { filas: { region: string; nProv: number; monto: number; montoPorProv: number }[]; regionSel: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <Users className="h-4 w-4 text-app-text/40" strokeWidth={1.5} />
          <span className="text-sm font-medium text-app-text">Competencia por región</span>
          <span className="text-label text-app-text/40 ml-1">dónde el monto se reparte entre pocos</span>
        </div>
      </CardHeader>
      <div className="overflow-auto max-h-[440px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-borders bg-background text-xs font-medium text-app-text/50 uppercase tracking-wide">
              <th scope="col" className="px-4 py-2.5 text-left">Región</th>
              <th scope="col" className="px-4 py-2.5 text-right">Proveedores</th>
              <th scope="col" className="px-4 py-2.5 text-right">Monto</th>
              <th scope="col" className="px-4 py-2.5 text-right">Monto / proveedor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borders/30">
            {filas.map((f) => {
              const sel = regionSel !== TODAS && f.region === regionSel;
              return (
                <tr key={f.region} className={cn('transition-colors', sel ? 'bg-primary/5' : 'hover:bg-background')}>
                  <td className="px-4 py-2.5 text-app-text font-medium">{f.region}</td>
                  <td className="px-4 py-2.5 text-right text-app-text/70 tabular-nums">{fmtInt(f.nProv)}</td>
                  <td className="px-4 py-2.5 text-right text-app-text/70 tabular-nums">{fmtCLP(f.monto)}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-app-text tabular-nums">{fmtCLP(f.montoPorProv)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ── helpers ────────────────────────────────────────────────────────────── */
function EstadoBadge({ estado }: { estado: string | null }) {
  const e = estado ?? '(sin estado)';
  const color = ESTADO_COLOR[e] ?? '#6b7280';
  return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ background: `${color}26`, color }}>{e}</span>;
}

function OrdenDetalle({ orden, onBuscarProveedor }: { orden: OCOrden; onBuscarProveedor: (nombre: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <EstadoBadge estado={orden.estado_texto} />
        {orden.proveedor_rut && <span className="text-xs text-app-text/50 font-mono">{orden.proveedor_rut}</span>}
      </div>
      <div className="rounded-[8px] bg-background px-4 py-3">
        <p className="text-label text-app-text/40">Monto de la orden</p>
        <p className="text-xl font-bold text-app-text mt-0.5">{orden.total != null ? fmtCLPFull(orden.total) : '— sin monto'}</p>
      </div>
      {orden.nombre && (
        <div className="flex items-start gap-3">
          <span className="text-app-text/40 mt-0.5 flex-shrink-0"><FileText className="h-4 w-4" strokeWidth={1.5} /></span>
          <div className="min-w-0"><p className="text-label text-app-text/40">Descripción</p><p className="text-sm text-app-text break-words">{orden.nombre}</p></div>
        </div>
      )}
      <dl className="space-y-3">
        <DetalleItem icon={<Users className="h-4 w-4" strokeWidth={1.5} />} label="Proveedor" value={orden.proveedor_nombre} />
        <DetalleItem icon={<Building2 className="h-4 w-4" strokeWidth={1.5} />} label="Organismo comprador" value={orden.comprador_nombre} />
        <DetalleItem icon={<MapPin className="h-4 w-4" strokeWidth={1.5} />} label="Comuna" value={orden.comprador_comuna} />
        <DetalleItem icon={<MapPin className="h-4 w-4" strokeWidth={1.5} />} label="Región" value={orden.region} />
        <DetalleItem icon={<Calendar className="h-4 w-4" strokeWidth={1.5} />} label="Fecha de envío" value={fmtFecha(orden.fecha_envio)} />
      </dl>
      <div className="flex flex-col gap-2 pt-2 border-t border-borders">
        <button onClick={() => { navigator.clipboard?.writeText(orden.codigo); toast.success('Código copiado'); }}
          className="flex items-center justify-center gap-2 rounded-[8px] border border-borders bg-surface px-4 py-2 text-sm font-medium text-app-text hover:bg-background transition-colors">
          <Copy className="h-4 w-4" strokeWidth={1.5} /> Copiar código
        </button>
        {orden.proveedor_nombre && (
          <button onClick={() => onBuscarProveedor(orden.proveedor_nombre!)}
            className="flex items-center justify-center gap-2 rounded-[8px] border border-borders bg-surface px-4 py-2 text-sm font-medium text-app-text hover:bg-background transition-colors">
            <Users className="h-4 w-4" strokeWidth={1.5} /> Buscar más de este proveedor
          </button>
        )}
      </div>
    </div>
  );
}

function DetalleItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-app-text/40 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0"><dt className="text-label text-app-text/40">{label}</dt><dd className="text-sm text-app-text break-words">{value && value.trim() ? value : '—'}</dd></div>
    </div>
  );
}
