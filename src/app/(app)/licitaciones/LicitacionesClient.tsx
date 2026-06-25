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
  Search, TrendingUp, Copy, ExternalLink, Building2, Calendar, Tag, MapPin,
  AlertTriangle, RotateCw, Radar, ChevronRight, ChevronLeft, Megaphone, Award, XCircle, Clock, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardBody, CardFooter, Skeleton, DetailDrawer } from '@/components/ui';
import { fmtCLP, fmtCLPFull, fmtInt, fmtMesCorto, fmtFecha } from '@/lib/format';
import {
  type LicitacionesData, type Licitacion,
  fetchLicLista, fetchLicResumen, type LicListaResult, type LicResumen,
} from '@/lib/data/licitaciones';
import { fetchComunasRef, type ComunaRef } from '@/lib/data/comunas';

const ESTADO_COLOR: Record<string, string> = {
  'Adjudicada': '#6DCFB0', 'Publicada': '#49C5EF', 'Cerrada': '#5B8FE8',
  'Desierta': '#E07C7C', 'Revocada': '#F0A857', 'Suspendida': '#A78BDB', '(sin estado)': '#D4D4D4',
};
const VIZ = ['#5B8FE8', '#A78BDB', '#7EC8E3', '#6DCFB0', '#F0A857', '#E07C7C', '#49C5EF'];
const TIPO_LABEL: Record<string, string> = {
  LP: 'Pública ≥1000 UTM', LE: 'Pública 100-1000 UTM', L1: 'Pública <100 UTM',
  LQ: 'Pública 2000-5000 UTM', LR: 'Pública ≥5000 UTM', LS: 'Servicios personales',
  O1: 'Obras <2000 UTM', CO: 'Compra ágil',
};
const billones = (v: number) => `$${(v / 1e12).toLocaleString('es-CL', { maximumFractionDigits: 1 })}B`;
// Rubros frecuentes reales (derivados de las categorías ONU/UNSPSC más comunes
// en los ítems). `q` es el término de búsqueda que maximiza coincidencias.
const RUBROS: { label: string; q: string }[] = [
  { label: 'Construcción', q: 'construcción' },
  { label: 'Limpieza', q: 'limpieza' },
  { label: 'Vehículos', q: 'vehículo' },
  { label: 'Eventos', q: 'eventos' },
  { label: 'Salud', q: 'médico' },
  { label: 'Capacitación', q: 'capacitación' },
  { label: 'Vigilancia', q: 'vigilancia' },
  { label: 'Software', q: 'software' },
  { label: 'Mantenimiento', q: 'mantenimiento' },
  { label: 'Computadores', q: 'computador' },
];

type Orden = 'recientes' | 'cierre' | 'monto';
type Metric = 'cantidad' | 'monto';
const TODAS = '__TODAS__';
const ABIERTA = 'Publicada';
const PAGE = 12;

export function LicitacionesClient({
  data, error, initialRegion, initialBusqueda, initialCod,
}: { data: LicitacionesData; error?: string; initialRegion?: string; initialBusqueda?: string; initialCod?: number }) {
  const [region, setRegion] = useState<string>(initialRegion ?? TODAS);
  const [cod, setCod] = useState<number | null>(initialCod ?? null);
  const [busqueda, setBusqueda] = useState(initialBusqueda ?? '');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [soloAbiertas, setSoloAbiertas] = useState(true);
  const [orden, setOrden] = useState<Orden>('recientes');
  const [metrica, setMetrica] = useState<Metric>('cantidad');
  const [page, setPage] = useState(0);

  const [comunas, setComunas] = useState<ComunaRef[]>([]);
  const [lista, setLista] = useState<LicListaResult | null>(null);
  const [loadingLista, setLoadingLista] = useState(true);
  const [resumen, setResumen] = useState<LicResumen | null>(null);
  const [selected, setSelected] = useState<Licitacion | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const headerVisible = useAutoHideHeader(scrollRef, 'scroll');

  const regionParam = region === TODAS ? null : region;
  const scoped = regionParam !== null || cod !== null;

  // Catálogo comunas (cascada)
  useEffect(() => { fetchComunasRef().then(setComunas).catch(() => setComunas([])); }, []);
  const comunaOpts = useMemo(() => comunas.filter((c) => region === TODAS || c.region === region).sort((a, b) => a.nombre.localeCompare(b.nombre)), [comunas, region]);
  const comunaNombre = useMemo(() => comunas.find((c) => c.cod === cod)?.nombre ?? '', [comunas, cod]);
  const scopeLabel = !scoped ? 'todo Chile' : cod != null ? (comunaNombre || 'comuna') : region;

  // Debounce búsqueda + reset página
  const [qDebounced, setQDebounced] = useState(busqueda);
  useEffect(() => { const t = setTimeout(() => setQDebounced(busqueda), 350); return () => clearTimeout(t); }, [busqueda]);
  useEffect(() => { setPage(0); }, [qDebounced, region, cod, filtroTipo, soloAbiertas, orden]);

  // Fetch lista (real, paginada)
  useEffect(() => {
    let alive = true; setLoadingLista(true);
    fetchLicLista({ region: regionParam, cod, estado: soloAbiertas ? ABIERTA : null, tipo: filtroTipo || null, q: qDebounced || null, sort: orden, limit: PAGE, offset: page * PAGE })
      .then((r) => { if (alive) { setLista(r); setLoadingLista(false); } })
      .catch(() => { if (alive) { setLista({ rows: [], has_more: false }); setLoadingLista(false); } });
    return () => { alive = false; };
  }, [regionParam, cod, soloAbiertas, filtroTipo, qDebounced, orden, page]);

  // Fetch KPIs scoped
  useEffect(() => {
    if (!scoped) { setResumen(null); return; }
    let alive = true;
    fetchLicResumen(regionParam, cod).then((r) => { if (alive) setResumen(r); }).catch(() => { if (alive) setResumen(null); });
    return () => { alive = false; };
  }, [regionParam, cod, scoped]);

  // KPIs: nacional (MV) o scoped (RPC)
  const kpis = useMemo(() => {
    if (scoped && resumen) {
      return { total: resumen.n_total, monto: resumen.monto, abiertas: resumen.n_publicada, adjudicada: resumen.n_adjudicada, desierta: resumen.n_desierta, tasaAdj: resumen.n_total ? (resumen.n_adjudicada / resumen.n_total) * 100 : 0 };
    }
    const base = data.regiones.reduce((a, r) => ({ total: a.total + r.n_total, monto: a.monto + r.monto_total, abiertas: a.abiertas + r.n_publicada, adjudicada: a.adjudicada + r.n_adjudicada, desierta: a.desierta + r.n_desierta }), { total: 0, monto: 0, abiertas: 0, adjudicada: 0, desierta: 0 });
    return { ...base, tasaAdj: base.total ? (base.adjudicada / base.total) * 100 : 0 };
  }, [scoped, resumen, data.regiones]);

  const regionesOrdenadas = useMemo(() => [...data.regiones].sort((a, b) => b.n_total - a.n_total), [data.regiones]);
  const dondeHayMas = useMemo(() => [...data.regiones].sort((a, b) => b.n_publicada - a.n_publicada).slice(0, 8), [data.regiones]);
  const maxAbiertas = dondeHayMas[0]?.n_publicada ?? 1;

  const estadoData = useMemo(() => {
    const rows = region === TODAS ? data.estado : data.estado.filter((e) => e.region === region);
    const map: Record<string, number> = {};
    for (const e of rows) map[e.estado] = (map[e.estado] ?? 0) + e.n_total;
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map).map(([estado, n]) => ({ estado, n, pct: total ? Math.round((n / total) * 100) : 0 })).sort((a, b) => b.n - a.n);
  }, [region, data.estado]);
  const mensualData = useMemo(() => {
    const rows = region === TODAS ? data.mensual : data.mensual.filter((m) => m.region === region);
    const map: Record<string, { n: number; monto: number }> = {};
    for (const m of rows) { if (!map[m.mes]) map[m.mes] = { n: 0, monto: 0 }; map[m.mes].n += m.n_total; map[m.mes].monto += m.monto_total; }
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
              <h1 className="text-h3 font-semibold text-app-text">Licitaciones</h1>
              <p className="text-label text-app-text/50 mt-0.5">Radar de oportunidades · ¿qué puede ofertar tu cliente ahora?</p>
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
                <button onClick={() => window.location.reload()} className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"><RotateCw className="h-3.5 w-3.5" /> Reintentar</button>
              </div>
            </div>
          )}

          {/* Buscador por rubro */}
          <Card>
            <CardBody className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-app-text/30 pointer-events-none" strokeWidth={1.5} />
                <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                  aria-label="Buscar oportunidades por rubro (producto), organismo o código"
                  placeholder="¿Qué busca tu cliente? Busca por producto: computadores, vehículos, construcción, aseo…"
                  className="w-full bg-background text-app-text rounded-[8px] border border-borders pl-11 pr-4 py-3 text-base focus:outline-none focus:border-2 focus:border-primary transition-colors" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-label text-app-text/40 mr-1">Rubros frecuentes:</span>
                {RUBROS.map(({ label, q }) => {
                  const activo = busqueda.trim().toLowerCase() === q;
                  return (
                    <button key={q} onClick={() => setBusqueda(activo ? '' : q)} aria-pressed={activo}
                      className={cn('text-xs px-3 py-1 rounded-full border transition-colors', activo ? 'bg-primary/10 border-primary/40 text-primary font-medium' : 'bg-surface border-borders text-app-text/60 hover:border-primary/40 hover:text-app-text')}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* KPIs (scoped) */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiBig icon={<Radar className="h-4 w-4" />} label="Oportunidades abiertas" value={fmtInt(kpis.abiertas)} />
            <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Monto estimado" value={fmtCLP(kpis.monto)} />
            <Kpi icon={<Award className="h-4 w-4" />} label="Adjudicadas" value={fmtInt(kpis.adjudicada)} accent="success" />
            <Kpi icon={<XCircle className="h-4 w-4" />} label="Desiertas" value={fmtInt(kpis.desierta)} />
            <Kpi icon={<Megaphone className="h-4 w-4" />} label="Tasa adjudicación" value={`${kpis.tasaAdj.toFixed(0)}%`} />
          </div>

          {/* Lista de oportunidades */}
          <Card>
            <CardHeader className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Radar className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <span className="text-sm font-medium text-app-text capitalize">Oportunidades · {scopeLabel}</span>
                {loadingLista && <Loader2 className="h-3.5 w-3.5 animate-spin text-app-text/40" />}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-background rounded-[6px] p-1">
                  {([['abiertas', 'Abiertas'], ['todas', 'Todas']] as const).map(([k, lbl]) => {
                    const on = (k === 'abiertas') === soloAbiertas;
                    return (<button key={k} onClick={() => setSoloAbiertas(k === 'abiertas')} className={cn('text-xs px-2.5 py-1 rounded-[4px] transition-colors', on ? 'bg-surface shadow-sm font-medium text-app-text' : 'text-app-text/50 hover:text-app-text')}>{lbl}</button>);
                  })}
                </div>
                <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} aria-label="Filtrar por tipo"
                  className="text-sm bg-surface text-app-text border border-borders rounded-[6px] px-2 py-1.5 focus:outline-none focus:border-2 focus:border-primary cursor-pointer">
                  <option value="">Todos los tipos</option>
                  {Object.keys(TIPO_LABEL).map((t) => (<option key={t} value={t}>{t} · {TIPO_LABEL[t]}</option>))}
                </select>
                <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)} aria-label="Ordenar"
                  className="text-sm bg-surface text-app-text border border-borders rounded-[6px] px-2 py-1.5 focus:outline-none focus:border-2 focus:border-primary cursor-pointer">
                  <option value="recientes">Más recientes</option>
                  <option value="cierre">Cierre más próximo</option>
                  <option value="monto">Mayor monto</option>
                </select>
              </div>
            </CardHeader>
            <CardBody>
              {loadingLista ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-[10px]" />)}
                </div>
              ) : (lista?.rows.length ?? 0) === 0 ? (
                <div className="text-center py-12 text-sm text-app-text/40">No hay oportunidades para este filtro. Prueba otro rubro o desactiva “Abiertas”.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[560px] overflow-y-auto pr-1">
                  {lista!.rows.map((l) => (<OportunidadCard key={l.codigo_externo} lic={l} onClick={() => setSelected(l)} />))}
                </div>
              )}
            </CardBody>
            <Pager page={page} hasMore={lista?.has_more ?? false} onPage={setPage} loading={loadingLista} />
          </Card>

          {/* Dónde hay más oportunidades */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <MapPin className="h-4 w-4 text-app-text/40" strokeWidth={1.5} />
                <span className="text-sm font-medium text-app-text">Dónde hay más oportunidades abiertas</span>
                <span className="text-label text-app-text/40 ml-1">clic para enfocar una región</span>
              </div>
            </CardHeader>
            <CardBody className="space-y-2.5">
              {dondeHayMas.map((r) => {
                const sel = region === r.region;
                return (
                  <button key={r.region} onClick={() => { setRegion(sel ? TODAS : r.region); setCod(null); }} className="w-full flex items-center gap-3 group focus:outline-none">
                    <span className={cn('text-sm w-40 text-left truncate flex-shrink-0', sel ? 'text-primary font-medium' : 'text-app-text/70 group-hover:text-app-text')}>{r.region}</span>
                    <div className="flex-1 bg-borders/40 rounded-full h-2"><div className={cn('h-2 rounded-full transition-all', sel ? 'bg-primary' : 'bg-primary/50 group-hover:bg-primary')} style={{ width: `${Math.max(4, (r.n_publicada / maxAbiertas) * 100)}%` }} /></div>
                    <span className="text-xs text-app-text/50 w-14 text-right flex-shrink-0 tabular-nums">{fmtInt(r.n_publicada)}</span>
                  </button>
                );
              })}
            </CardBody>
          </Card>

          {/* Análisis del mercado (colapsable) */}
          <details className="group bg-surface border border-borders rounded-[8px]">
            <summary className="flex items-center gap-2 cursor-pointer select-none px-4 py-3 text-sm font-medium text-app-text">
              <ChevronRight className="h-4 w-4 text-app-text/40 transition-transform group-open:rotate-90" />
              Análisis del mercado · estados y tendencia
              <span className="text-label text-app-text/40 font-normal ml-1">(nacional / por región)</span>
            </summary>
            <div className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-background rounded-[8px] p-4">
                  <p className="text-sm font-medium text-app-text mb-2">Licitaciones por región</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={regionesOrdenadas} margin={{ top: 4, right: 8, left: 4, bottom: 56 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#D4D4D4" vertical={false} />
                      <XAxis dataKey="region" tick={{ fontSize: 9, fill: '#24242480' }} tickLine={false} angle={-40} textAnchor="end" interval={0} height={60} />
                      <YAxis tick={{ fontSize: 10, fill: '#24242480' }} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => fmtInt(Number(v))} />
                      <ChartTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #D4D4D4', background: '#FAFAFA' }} formatter={(v) => [fmtInt(Number(v)), 'Licitaciones']} />
                      <Bar dataKey="n_total" radius={[4, 4, 0, 0]}>
                        {regionesOrdenadas.map((entry) => (<Cell key={entry.region} fill={region !== TODAS && entry.region !== region ? '#D4D4D4' : '#49C5EF'} opacity={region !== TODAS && entry.region !== region ? 0.5 : 1} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-background rounded-[8px] p-4">
                  <p className="text-sm font-medium text-app-text mb-2 capitalize">Estado · {region === TODAS ? 'nacional' : region}</p>
                  <ResponsiveContainer width="100%" height={216}>
                    <PieChart>
                      <Pie data={estadoData} dataKey="n" nameKey="estado" cx="50%" cy="45%" outerRadius={72} innerRadius={38}>
                        {estadoData.map((e, i) => (<Cell key={e.estado} fill={ESTADO_COLOR[e.estado] ?? VIZ[i % VIZ.length]} />))}
                      </Pie>
                      <ChartTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #D4D4D4', background: '#FAFAFA' }} formatter={(v) => [fmtInt(Number(v)), 'Licitaciones']} />
                      <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} formatter={(value, entry) => `${value} (${(entry?.payload as { pct?: number })?.pct ?? 0}%)`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-background rounded-[8px] p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-app-text">Tendencia mensual · <span className="capitalize">{region === TODAS ? 'nacional' : region}</span></p>
                  <div className="flex items-center gap-1 bg-surface rounded-[6px] p-1">
                    {(['cantidad', 'monto'] as Metric[]).map((m) => (<button key={m} onClick={() => setMetrica(m)} className={cn('text-xs px-2.5 py-1 rounded-[4px] transition-colors', metrica === m ? 'bg-background shadow-sm font-medium text-app-text' : 'text-app-text/50 hover:text-app-text')}>{m === 'monto' ? 'Monto' : 'Cantidad'}</button>))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={mensualData} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D4D4D4" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#24242480' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#24242480' }} tickLine={false} axisLine={false} width={52} tickFormatter={(v) => (metrica === 'monto' ? billones(Number(v)) : fmtInt(Number(v)))} />
                    <ChartTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #D4D4D4', background: '#FAFAFA' }} formatter={(v) => metrica === 'monto' ? [fmtCLPFull(Number(v)), 'Monto'] : [fmtInt(Number(v)), 'Licitaciones']} />
                    <Line type="monotone" dataKey={metrica} stroke="#49C5EF" strokeWidth={2} dot={{ r: 2.5, fill: '#49C5EF' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </details>
        </div>
      </div>

      <DetailDrawer open={selected !== null} onClose={() => setSelected(null)}
        title={selected?.nombre ?? selected?.codigo_externo ?? 'Licitación'} subtitle={selected?.codigo_externo}>
        {selected && <LicitacionDetalle lic={selected} onBuscarOrganismo={(nombre) => { setBusqueda(nombre); setSelected(null); toast.success('Filtrando por organismo'); }} />}
      </DetailDrawer>
    </div>
  );
}

/* ── Paginación (por has_more) ──────────────────────────────────────────── */
function Pager({ page, hasMore, onPage, loading }: { page: number; hasMore: boolean; onPage: (p: number) => void; loading: boolean }) {
  return (
    <CardFooter className="flex items-center justify-end gap-2 text-xs text-app-text/50">
      <button onClick={() => onPage(Math.max(0, page - 1))} disabled={page <= 0 || loading}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] border border-borders hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="h-3.5 w-3.5" /> Anterior</button>
      <span className="tabular-nums" aria-live="polite">Página {page + 1}</span>
      <button onClick={() => onPage(page + 1)} disabled={!hasMore || loading}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] border border-borders hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Siguiente <ChevronRight className="h-3.5 w-3.5" /></button>
    </CardFooter>
  );
}

/* ── Tarjeta de oportunidad ─────────────────────────────────────────────── */
function OportunidadCard({ lic, onClick }: { lic: Licitacion; onClick: () => void }) {
  const monto = lic.monto_estimado != null && lic.unidad_monetaria === 'CLP' ? fmtCLP(lic.monto_estimado) : 'Sin monto';
  return (
    <div onClick={onClick} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      tabIndex={0} role="button" aria-label={`Evaluar ${lic.nombre ?? lic.codigo_externo}`}
      className="group flex flex-col gap-2 rounded-[10px] border border-borders bg-surface p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <div className="flex items-center justify-between gap-2">
        <EstadoBadge estado={lic.estado_texto} />
        <span className="text-sm font-bold text-app-text whitespace-nowrap">{monto}</span>
      </div>
      <p className="text-sm font-medium text-app-text leading-snug line-clamp-2">{lic.nombre ?? lic.codigo_externo}</p>
      <div className="flex flex-col gap-1 text-xs text-app-text/50">
        <span className="inline-flex items-center gap-1.5 truncate"><Building2 className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />{lic.comprador_nombre ?? '—'}</span>
        <span className="inline-flex items-center gap-1.5 truncate"><MapPin className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />{lic.comprador_comuna ? `${lic.comprador_comuna} · ` : ''}{lic.region}</span>
      </div>
      <div className="flex items-center justify-between gap-2 pt-1 mt-auto border-t border-borders/60">
        <span className="inline-flex items-center gap-1.5 text-xs text-app-text/50"><Clock className="h-3.5 w-3.5" strokeWidth={1.5} /> Cierra: {fmtFecha(lic.fecha_cierre)}</span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary group-hover:underline">Evaluar <ChevronRight className="h-3.5 w-3.5" /></span>
      </div>
    </div>
  );
}

/* ── helpers ────────────────────────────────────────────────────────────── */
function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: 'success' | 'primary' }) {
  const valueColor = accent === 'success' ? 'text-success' : accent === 'primary' ? 'text-primary' : 'text-app-text';
  return (
    <Card><CardBody className="py-3"><div className="flex items-center gap-1.5 text-app-text/40">{icon}<p className="text-label">{label}</p></div><p className={cn('text-xl font-bold mt-1 truncate', valueColor)}>{value}</p></CardBody></Card>
  );
}
function KpiBig({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="border-primary/40 ring-1 ring-primary/20"><CardBody className="py-3"><div className="flex items-center gap-1.5 text-primary">{icon}<p className="text-label font-medium">{label}</p></div><p className="text-2xl font-bold mt-1 truncate text-primary">{value}</p></CardBody></Card>
  );
}

function EstadoBadge({ estado }: { estado: string | null }) {
  const e = estado ?? '(sin estado)';
  const color = ESTADO_COLOR[e] ?? '#6b7280';
  return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ background: `${color}26`, color }}>{e}</span>;
}

function LicitacionDetalle({ lic, onBuscarOrganismo }: { lic: Licitacion; onBuscarOrganismo: (nombre: string) => void }) {
  const fichaUrl = `https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idLicitacion=${encodeURIComponent(lic.codigo_externo)}`;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <EstadoBadge estado={lic.estado_texto} />
        {lic.tipo_licitacion && (<span className="inline-flex items-center gap-1 text-xs text-app-text/50"><Tag className="h-3.5 w-3.5" strokeWidth={1.5} />{lic.tipo_licitacion}{TIPO_LABEL[lic.tipo_licitacion] ? ` · ${TIPO_LABEL[lic.tipo_licitacion]}` : ''}</span>)}
      </div>
      <div className="rounded-[8px] bg-background px-4 py-3">
        <p className="text-label text-app-text/40">Monto estimado</p>
        <p className="text-xl font-bold text-app-text mt-0.5">{lic.monto_estimado != null && lic.unidad_monetaria === 'CLP' ? fmtCLPFull(lic.monto_estimado) : '— sin monto publicado'}</p>
      </div>
      <dl className="space-y-3">
        <DetalleItem icon={<Building2 className="h-4 w-4" strokeWidth={1.5} />} label="Organismo comprador" value={lic.comprador_nombre} />
        <DetalleItem icon={<MapPin className="h-4 w-4" strokeWidth={1.5} />} label="Comuna" value={lic.comprador_comuna} />
        <DetalleItem icon={<MapPin className="h-4 w-4" strokeWidth={1.5} />} label="Región" value={lic.region} />
        <DetalleItem icon={<Calendar className="h-4 w-4" strokeWidth={1.5} />} label="Publicación" value={fmtFecha(lic.fecha_publicacion)} />
        <DetalleItem icon={<Clock className="h-4 w-4" strokeWidth={1.5} />} label="Cierre" value={fmtFecha(lic.fecha_cierre)} />
        <DetalleItem icon={<Award className="h-4 w-4" strokeWidth={1.5} />} label="Adjudicación" value={fmtFecha(lic.fecha_adjudicacion)} />
      </dl>
      <div className="flex flex-col gap-2 pt-2 border-t border-borders">
        <button onClick={() => { navigator.clipboard?.writeText(lic.codigo_externo); toast.success('Código copiado'); }}
          className="flex items-center justify-center gap-2 rounded-[8px] border border-borders bg-surface px-4 py-2 text-sm font-medium text-app-text hover:bg-background transition-colors"><Copy className="h-4 w-4" strokeWidth={1.5} /> Copiar código</button>
        {lic.comprador_nombre && (<button onClick={() => onBuscarOrganismo(lic.comprador_nombre!)} className="flex items-center justify-center gap-2 rounded-[8px] border border-borders bg-surface px-4 py-2 text-sm font-medium text-app-text hover:bg-background transition-colors"><Building2 className="h-4 w-4" strokeWidth={1.5} /> Buscar más de este organismo</button>)}
        <a href={fichaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-[8px] bg-primary px-4 py-2 text-sm font-medium text-surface hover:bg-primary-hover transition-colors"><ExternalLink className="h-4 w-4" strokeWidth={1.5} /> Ver ficha en Mercado Público</a>
      </div>
    </div>
  );
}

function DetalleItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3"><span className="text-app-text/40 mt-0.5 flex-shrink-0">{icon}</span><div className="min-w-0"><dt className="text-label text-app-text/40">{label}</dt><dd className="text-sm text-app-text break-words">{value && value.trim() ? value : '—'}</dd></div></div>
  );
}
