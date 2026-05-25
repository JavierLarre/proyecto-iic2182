'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  ordenes,
  montoTotalPorMunicipalidad,
  distribucionRubro,
  concentracionProveedores,
  MUNICIPALIDADES,
} from '@/data/ordenes';
import { AlertTriangle, BarChart2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardBody, CardFooter, Badge, Input } from '@/components/ui';

// Data-viz palette — matches style guide
const RUBRO_COLORS: Record<string, string> = {
  Construcción: '#5B8FE8',
  Tecnología:   '#A78BDB',
  Servicios:    '#7EC8E3',
  Alimentación: '#F0A857',
  Seguridad:    '#E07C7C',
  Transporte:   '#6DCFB0',
  Mantención:   '#49C5EF',
};

const VIZ_COLORS = ['#5B8FE8', '#A78BDB', '#7EC8E3', '#6DCFB0', '#F0A857', '#E07C7C', '#49C5EF'];

type SortField = 'fecha' | 'monto' | 'proveedor';
type SortDir   = 'asc' | 'desc';

function fmt(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

function fmtFull(n: number) {
  return `$${n.toLocaleString('es-CL')}`;
}

const municiShort = (m: string) => m.replace('Municipalidad de ', '');

export default function DashboardPage() {
  const [muniSel, setMuniSel]     = useState('');
  const [busqueda, setBusqueda]   = useState('');
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortDir, setSortDir]     = useState<SortDir>('desc');

  const barData      = montoTotalPorMunicipalidad();
  const rubroData    = useMemo(() => distribucionRubro(muniSel), [muniSel]);
  const concentracion = useMemo(() => concentracionProveedores(muniSel), [muniSel]);

  const ordenesFiltradas = useMemo(() => {
    let rows = muniSel ? ordenes.filter(o => o.municipalidad === muniSel) : ordenes;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      rows = rows.filter(
        o =>
          o.proveedor.toLowerCase().includes(q) ||
          o.organismo.toLowerCase().includes(q) ||
          o.descripcion.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q),
      );
    }
    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'fecha')     cmp = a.fecha.localeCompare(b.fecha);
      else if (sortField === 'monto') cmp = a.monto - b.monto;
      else                            cmp = a.proveedor.localeCompare(b.proveedor);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [muniSel, busqueda, sortField, sortDir]);

  const totalMonto = ordenesFiltradas.reduce((s, o) => s + o.monto, 0);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp className="h-3 w-3 opacity-30" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-primary" />
      : <ChevronDown className="h-3 w-3 text-primary" />;
  }

  const topProveedor = concentracion[0];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">

      {/* Header */}
      <div className="bg-surface border-b border-borders px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-app-text">Dashboard de Análisis Económico</h1>
            <p className="text-xs text-app-text/50 mt-0.5">
              Órdenes de compra — relaciones económicas entre proveedores y municipalidades
            </p>
          </div>
          <select
            value={muniSel}
            onChange={e => setMuniSel(e.target.value)}
            className="text-sm bg-surface text-app-text border border-borders rounded-[6px] px-3 py-1.5 focus:outline-none focus:border-2 focus:border-primary transition-colors cursor-pointer"
          >
            <option value="">Todas las municipalidades</option>
            {MUNICIPALIDADES.map(m => (
              <option key={m} value={m}>{municiShort(m)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-4 max-w-[1400px] mx-auto">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Órdenes',           value: ordenesFiltradas.length },
              { label: 'Monto total',        value: fmt(totalMonto) },
              { label: 'Proveedores únicos', value: concentracion.length },
              {
                label: 'Ticket promedio',
                value: ordenesFiltradas.length > 0 ? fmt(totalMonto / ordenesFiltradas.length) : '$0',
              },
            ].map(({ label, value }) => (
              <Card key={label}>
                <CardBody className="py-3">
                  <p className="text-xs text-app-text/50 label">{label}</p>
                  <p className="text-2xl font-bold text-app-text mt-0.5">{value}</p>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Alerta concentración */}
          {topProveedor && topProveedor.pct >= 30 && (
            <div className="flex items-start gap-3 bg-warning/10 border border-warning/40 rounded-[8px] px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-sm text-app-text">
                <span className="font-semibold">{topProveedor.proveedor}</span> concentra el{' '}
                <span className="font-semibold">{topProveedor.pct}%</span> del monto total transado
                {muniSel ? ` en ${municiShort(muniSel)}` : ''}{' '}
                ({topProveedor.contratos} contratos · {fmt(topProveedor.monto)}).
              </p>
            </div>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Bar chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-app-text/40" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-app-text">Monto transado por municipalidad</span>
                </div>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D4D4D4" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#24242480' }}
                      tickLine={false}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#24242480' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => `${(v / 1_000_000).toFixed(0)}M`}
                      width={42}
                    />
                    <ChartTooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #D4D4D4', background: '#FAFAFA' }}
                      formatter={(v) => [fmtFull(Number(v)), 'Monto']}
                    />
                    <Bar dataKey="monto" radius={[4, 4, 0, 0]}>
                      {barData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={muniSel && `Municipalidad de ${entry.name}` !== muniSel ? '#D4D4D4' : '#49C5EF'}
                          opacity={muniSel && `Municipalidad de ${entry.name}` !== muniSel ? 0.5 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Donut chart */}
            <Card>
              <CardHeader>
                <p className="text-sm font-medium text-app-text">Distribución por rubro</p>
                <p className="text-xs text-app-text/40 mt-0.5">
                  {muniSel ? municiShort(muniSel) : 'Todas las municipalidades'}
                </p>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={rubroData}
                      dataKey="monto"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={72}
                      innerRadius={36}
                    >
                      {rubroData.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={RUBRO_COLORS[entry.name] ?? VIZ_COLORS[i % VIZ_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #D4D4D4', background: '#FAFAFA' }}
                      formatter={(v) => [fmt(Number(v)), 'Monto']}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={7}
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                      formatter={(value, entry: any) => `${value} (${entry.payload.pct}%)`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>

          {/* Concentración de proveedores */}
          <Card>
            <CardHeader>
              <p className="text-sm font-medium text-app-text">
                Concentración de proveedores{muniSel ? ` — ${municiShort(muniSel)}` : ''}
              </p>
            </CardHeader>
            <CardBody className="space-y-3">
              {concentracion.slice(0, 8).map((p, i) => (
                <div key={p.rut} className="flex items-center gap-3">
                  <span className="text-xs text-app-text/30 w-4 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-app-text font-medium truncate">{p.proveedor}</span>
                      <span className="text-xs text-app-text/50 flex-shrink-0 ml-2">
                        {p.contratos} OC · {fmt(p.monto)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-borders/40 rounded-full h-1.5">
                        <div
                          className={cn(
                            'h-1.5 rounded-full transition-all',
                            p.pct >= 40 ? 'bg-error' : p.pct >= 25 ? 'bg-warning' : 'bg-primary',
                          )}
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          'text-xs font-semibold w-8 text-right flex-shrink-0',
                          p.pct >= 40 ? 'text-error' : p.pct >= 25 ? 'text-warning' : 'text-primary',
                        )}
                      >
                        {p.pct}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Tabla órdenes de compra */}
          <Card>
            <CardHeader className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-app-text">Órdenes de compra</span>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-app-text/30 pointer-events-none" strokeWidth={1.5} />
                <Input
                  type="text"
                  placeholder="Buscar proveedor, organismo, descripción..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="pl-8 text-sm py-1.5"
                />
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-borders bg-background">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-app-text/50 uppercase tracking-wide">ID</th>
                    <th
                      className="text-left px-4 py-2.5 text-xs font-medium text-app-text/50 uppercase tracking-wide cursor-pointer hover:text-app-text transition-colors"
                      onClick={() => toggleSort('proveedor')}
                    >
                      <span className="flex items-center gap-1">Proveedor <SortIcon field="proveedor" /></span>
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-app-text/50 uppercase tracking-wide">Organismo</th>
                    {!muniSel && (
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-app-text/50 uppercase tracking-wide">Municipalidad</th>
                    )}
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-app-text/50 uppercase tracking-wide">Descripción</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-app-text/50 uppercase tracking-wide">Rubro</th>
                    <th
                      className="text-right px-4 py-2.5 text-xs font-medium text-app-text/50 uppercase tracking-wide cursor-pointer hover:text-app-text transition-colors"
                      onClick={() => toggleSort('monto')}
                    >
                      <span className="flex items-center justify-end gap-1">Monto <SortIcon field="monto" /></span>
                    </th>
                    <th
                      className="text-left px-4 py-2.5 text-xs font-medium text-app-text/50 uppercase tracking-wide cursor-pointer hover:text-app-text transition-colors"
                      onClick={() => toggleSort('fecha')}
                    >
                      <span className="flex items-center gap-1">Fecha <SortIcon field="fecha" /></span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borders/30">
                  {ordenesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-app-text/40">
                        No hay órdenes que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    ordenesFiltradas.map(o => (
                      <tr key={o.id} className="hover:bg-background transition-colors">
                        <td className="px-4 py-2.5 text-xs text-app-text/40 font-mono whitespace-nowrap">{o.id}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="font-medium text-app-text">{o.proveedor}</div>
                          <div className="text-xs text-app-text/40">{o.rut}</div>
                        </td>
                        <td className="px-4 py-2.5 text-app-text/60 text-xs whitespace-nowrap">{o.organismo}</td>
                        {!muniSel && (
                          <td className="px-4 py-2.5 text-app-text/60 text-xs whitespace-nowrap">{municiShort(o.municipalidad)}</td>
                        )}
                        <td className="px-4 py-2.5 text-app-text/70 max-w-[240px]">
                          <span className="line-clamp-2 text-xs leading-snug">{o.descripcion}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background: `${RUBRO_COLORS[o.rubro] ?? '#6b7280'}26`,
                              color: RUBRO_COLORS[o.rubro] ?? '#6b7280',
                            }}
                          >
                            {o.rubro}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-app-text whitespace-nowrap">
                          {fmt(o.monto)}
                        </td>
                        <td className="px-4 py-2.5 text-app-text/50 text-xs whitespace-nowrap">{o.fecha}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <CardFooter className="text-xs text-app-text/40">
              {ordenesFiltradas.length} orden{ordenesFiltradas.length !== 1 ? 'es' : ''} · total {fmt(totalMonto)} · datos de demostración 2024
            </CardFooter>
          </Card>

        </div>
      </div>
    </div>
  );
}
