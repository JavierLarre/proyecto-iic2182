'use client';

import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import Link from 'next/link';
import { X, MapPin, Loader2, Receipt, TrendingUp, Users, Building2, FileText, Award, FileSearch, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fmtCLP, fmtCLPFull, fmtInt, fmtMesCorto, fmtFecha } from '@/lib/format';
import {
  getComunaResumen, getComunaListas,
  type ComunaResumen, type ComunaListas, type ProvOrg,
} from '@/lib/data/mapa';

const ESTADO_COLOR: Record<string, string> = {
  'Recepción Conforme': '#6DCFB0', 'Aceptada': '#5B8FE8', 'Enviada a Proveedor': '#7EC8E3',
  'En proceso': '#F0A857', 'Cancelada': '#E07C7C', 'No aceptada': '#A78BDB', '(sin estado)': '#D4D4D4',
};
const VIZ = ['#5B8FE8', '#A78BDB', '#7EC8E3', '#6DCFB0', '#F0A857', '#E07C7C', '#49C5EF'];
const billones = (v: number) => `$${(v / 1e12).toLocaleString('es-CL', { maximumFractionDigits: 2 })}B`;

type Tab = 'proveedores' | 'organismos' | 'ordenes' | 'licitaciones';

export function ComunaPanel({
  cod, nombre, regionNombre, provincia, onClose,
}: { cod: number; nombre: string; regionNombre: string; provincia: string; onClose: () => void }) {
  const [resumen, setResumen] = useState<ComunaResumen | null>(null);
  const [listas, setListas] = useState<ComunaListas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('proveedores');
  const [metricaMes, setMetricaMes] = useState<'monto' | 'cantidad'>('monto');

  useEffect(() => {
    let alive = true;
    getComunaResumen(cod).then((d) => alive && setResumen(d)).catch((e) => alive && setError(e.message));
    getComunaListas(cod).then((d) => alive && setListas(d)).catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [cod]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sinDatos = resumen?.sin_datos;

  const estadoData = (resumen?.estado_oc ?? []).map((e) => ({ ...e }));
  const totalEstado = estadoData.reduce((s, e) => s + e.n, 0);
  const mensualData = (resumen?.mensual_oc ?? []).map((m) => ({ mes: fmtMesCorto(m.mes + '-01'), cantidad: m.n, monto: m.monto }));
  const montoComuna = resumen?.resumen.monto_total ?? 0;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop que difumina el mapa */}
      <div className="absolute inset-0 bg-app-text/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-background border border-borders rounded-[12px] shadow-2xl w-full h-full max-w-[1200px] max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-surface border-b border-borders px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[8px] bg-primary/15 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-h3 font-semibold text-app-text leading-tight">{nombre}</h2>
              <p className="text-label text-app-text/50">{provincia} · {regionNombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-[8px] hover:bg-background flex items-center justify-center text-app-text/50 hover:text-app-text transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Acciones cruzadas: saltar a las otras vistas pre-filtradas por la comuna */}
        {!sinDatos && (
          <div className="bg-surface border-b border-borders px-6 py-2.5 flex flex-wrap items-center gap-2 flex-shrink-0">
            <span className="text-label text-app-text/40 mr-1">Profundizar:</span>
            <Link href={`/dashboard?region=${encodeURIComponent(regionNombre)}&comunaCod=${cod}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-app-text/70 hover:text-primary border border-borders hover:border-primary/40 rounded-full px-3 py-1 transition-colors">
              <Receipt className="h-3.5 w-3.5" strokeWidth={1.5} /> Órdenes en {nombre} <ArrowRight className="h-3 w-3" />
            </Link>
            <Link href={`/licitaciones?region=${encodeURIComponent(regionNombre)}&comunaCod=${cod}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-app-text/70 hover:text-primary border border-borders hover:border-primary/40 rounded-full px-3 py-1 transition-colors">
              <FileSearch className="h-3.5 w-3.5" strokeWidth={1.5} /> Licitaciones en {nombre} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-error/10 border border-error/40 rounded-[8px] px-4 py-3 text-sm text-error">
              Error al cargar datos: {error}
            </div>
          )}

          {sinDatos ? (
            <div className="text-center py-16 text-app-text/50">
              <p className="text-sm">No hay órdenes de compra ni licitaciones registradas para esta comuna.</p>
            </div>
          ) : (
            <>
              {/* KPIs */}
              {!resumen ? (
                <LoadingBlock label="Cargando indicadores..." />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <Kpi icon={<Receipt className="h-4 w-4" />} label="Órdenes" value={fmtInt(resumen.resumen.n_ordenes)} />
                  <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Monto OC" value={fmtCLP(resumen.resumen.monto_total)} />
                  <Kpi icon={<Users className="h-4 w-4" />} label="Proveedores" value={fmtInt(resumen.resumen.n_proveedores)} />
                  <Kpi icon={<Building2 className="h-4 w-4" />} label="Organismos" value={fmtInt(resumen.resumen.n_organismos)} />
                  <Kpi icon={<Receipt className="h-4 w-4" />} label="Ticket prom." value={fmtCLP(resumen.resumen.ticket)} />
                  <Kpi icon={<FileText className="h-4 w-4" />} label="Licitaciones" value={fmtInt(resumen.lic.n_licitaciones)} />
                  <Kpi icon={<Award className="h-4 w-4" />} label="Adjudicadas" value={fmtInt(resumen.lic.n_adjudicadas)} accent />
                </div>
              )}

              {/* Charts */}
              {resumen && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-surface border border-borders rounded-[8px] p-4">
                    <p className="text-sm font-medium text-app-text mb-2">Estado de las órdenes</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={estadoData} dataKey="n" nameKey="estado" cx="50%" cy="45%" outerRadius={64} innerRadius={34}>
                          {estadoData.map((e, i) => <Cell key={e.estado} fill={ESTADO_COLOR[e.estado] ?? VIZ[i % VIZ.length]} />)}
                        </Pie>
                        <ChartTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #D4D4D4', background: '#FAFAFA' }} formatter={(v) => [fmtInt(Number(v)), 'Órdenes']} />
                        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, paddingTop: 6 }}
                          formatter={(value: string) => { const e = estadoData.find((x) => x.estado === value); const pct = totalEstado ? Math.round((e?.n ?? 0) / totalEstado * 100) : 0; return `${value} (${pct}%)`; }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-surface border border-borders rounded-[8px] p-4 lg:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-app-text">Tendencia mensual de órdenes</p>
                      <div className="flex items-center gap-1 bg-background rounded-[6px] p-1">
                        {(['monto', 'cantidad'] as const).map((m) => (
                          <button key={m} onClick={() => setMetricaMes(m)}
                            className={cn('text-xs px-2 py-0.5 rounded-[4px] transition-colors', metricaMes === m ? 'bg-surface shadow-sm font-medium text-app-text' : 'text-app-text/50 hover:text-app-text')}>
                            {m === 'monto' ? 'Monto' : 'Cantidad'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={mensualData} margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#D4D4D4" vertical={false} />
                        <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#24242480' }} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#24242480' }} tickLine={false} axisLine={false} width={50}
                          tickFormatter={(v) => (metricaMes === 'monto' ? billones(Number(v)) : fmtInt(Number(v)))} />
                        <ChartTooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #D4D4D4', background: '#FAFAFA' }}
                          formatter={(v) => metricaMes === 'monto' ? [fmtCLPFull(Number(v)), 'Monto'] : [fmtInt(Number(v)), 'Órdenes']} />
                        <Line type="monotone" dataKey={metricaMes} stroke="#49C5EF" strokeWidth={2} dot={{ r: 2, fill: '#49C5EF' }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="bg-surface border border-borders rounded-[8px] overflow-hidden">
                <div className="flex border-b border-borders overflow-x-auto">
                  {([
                    ['proveedores', 'Top proveedores'],
                    ['organismos', 'Top organismos'],
                    ['ordenes', 'Órdenes recientes'],
                    ['licitaciones', 'Licitaciones recientes'],
                  ] as [Tab, string][]).map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)}
                      className={cn('px-4 py-2.5 text-sm whitespace-nowrap transition-colors border-b-2 -mb-px',
                        tab === key ? 'border-primary text-app-text font-medium' : 'border-transparent text-app-text/50 hover:text-app-text')}>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="p-4">
                  {!listas ? (
                    <LoadingBlock label="Cargando detalle..." />
                  ) : tab === 'proveedores' ? (
                    <RankingList items={listas.top_proveedores} total={montoComuna} emptyLabel="Sin proveedores." />
                  ) : tab === 'organismos' ? (
                    <RankingList items={listas.top_organismos} total={montoComuna} emptyLabel="Sin organismos." />
                  ) : tab === 'ordenes' ? (
                    <OrdenesTable rows={listas.ordenes_recientes} />
                  ) : (
                    <LicitacionesTable rows={listas.licitaciones_recientes} />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-app-text/50">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface border border-borders rounded-[8px] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-app-text/40">{icon}<span className="text-label">{label}</span></div>
      <p className={cn('text-lg font-bold mt-0.5 truncate', accent ? 'text-success' : 'text-app-text')}>{value}</p>
    </div>
  );
}

function RankingList({ items, total, emptyLabel }: { items: ProvOrg[]; total: number; emptyLabel: string }) {
  if (!items.length) return <p className="text-sm text-app-text/40 py-6 text-center">{emptyLabel}</p>;
  return (
    <div className="space-y-3">
      {items.map((p, i) => {
        const pct = total ? (p.monto / total) * 100 : 0;
        return (
          <div key={(p.rut ?? '') + i} className="flex items-center gap-3">
            <span className="text-xs text-app-text/30 w-4 text-right flex-shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-app-text font-medium truncate">{p.nombre ?? p.rut ?? '—'}</span>
                <span className="text-xs text-app-text/50 flex-shrink-0 ml-2">{fmtInt(p.n)} · {fmtCLP(p.monto)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-borders/40 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <span className="text-xs font-semibold w-11 text-right flex-shrink-0 text-primary">{pct.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string | null }) {
  const e = estado ?? '(sin estado)';
  const color = ESTADO_COLOR[e] ?? '#6b7280';
  return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" style={{ background: `${color}26`, color }}>{e}</span>;
}

function OrdenesTable({ rows }: { rows: ComunaListas['ordenes_recientes'] }) {
  if (!rows.length) return <p className="text-sm text-app-text/40 py-6 text-center">Sin órdenes recientes.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-borders text-left text-xs text-app-text/50 uppercase tracking-wide">
          <th className="py-2 pr-3">Código</th><th className="py-2 pr-3">Descripción</th><th className="py-2 pr-3">Proveedor</th><th className="py-2 pr-3">Estado</th><th className="py-2 pr-3 text-right">Monto</th><th className="py-2">Fecha</th>
        </tr></thead>
        <tbody className="divide-y divide-borders/30">
          {rows.map((o) => (
            <tr key={o.codigo} className="hover:bg-background">
              <td className="py-2 pr-3 text-xs font-mono text-app-text/40 whitespace-nowrap">{o.codigo}</td>
              <td className="py-2 pr-3 max-w-[260px]"><span className="line-clamp-2 text-xs leading-snug">{o.nombre ?? '—'}</span></td>
              <td className="py-2 pr-3 text-xs text-app-text/60 max-w-[160px]"><span className="truncate block">{o.proveedor_nombre ?? '—'}</span></td>
              <td className="py-2 pr-3"><EstadoBadge estado={o.estado} /></td>
              <td className="py-2 pr-3 text-right font-medium whitespace-nowrap">{o.total != null ? fmtCLP(o.total) : '—'}</td>
              <td className="py-2 text-xs text-app-text/50 whitespace-nowrap">{fmtFecha(o.fecha_envio)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LicitacionesTable({ rows }: { rows: ComunaListas['licitaciones_recientes'] }) {
  if (!rows.length) return <p className="text-sm text-app-text/40 py-6 text-center">Sin licitaciones recientes.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-borders text-left text-xs text-app-text/50 uppercase tracking-wide">
          <th className="py-2 pr-3">Código</th><th className="py-2 pr-3">Nombre</th><th className="py-2 pr-3">Tipo</th><th className="py-2 pr-3">Estado</th><th className="py-2 pr-3 text-right">Monto est.</th><th className="py-2">Publicación</th>
        </tr></thead>
        <tbody className="divide-y divide-borders/30">
          {rows.map((l) => (
            <tr key={l.codigo} className="hover:bg-background">
              <td className="py-2 pr-3 text-xs font-mono text-app-text/40 whitespace-nowrap">{l.codigo}</td>
              <td className="py-2 pr-3 max-w-[280px]"><span className="line-clamp-2 text-xs leading-snug">{l.nombre ?? '—'}</span></td>
              <td className="py-2 pr-3 text-xs text-app-text/60">{l.tipo ?? '—'}</td>
              <td className="py-2 pr-3"><EstadoBadge estado={l.estado} /></td>
              <td className="py-2 pr-3 text-right font-medium whitespace-nowrap">{l.monto_estimado != null && l.unidad_monetaria === 'CLP' ? fmtCLP(l.monto_estimado) : '—'}</td>
              <td className="py-2 text-xs text-app-text/50 whitespace-nowrap">{fmtFecha(l.fecha_publicacion)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
