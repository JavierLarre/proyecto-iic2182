'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

const RUBRO_COLORS: Record<string, string> = {
  Construcción: '#2563eb',
  Tecnología: '#7c3aed',
  Servicios: '#0891b2',
  Alimentación: '#d97706',
  Seguridad: '#dc2626',
  Transporte: '#059669',
  Mantención: '#65a30d',
};

const PIE_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#d97706', '#dc2626', '#059669', '#65a30d'];

type SortField = 'fecha' | 'monto' | 'proveedor';
type SortDir = 'asc' | 'desc';

function fmt(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

function fmtFull(n: number) {
  return `$${n.toLocaleString('es-CL')}`;
}

const municiShort = (m: string) => m.replace('Municipalidad de ', '');

export default function DashboardPage() {
  const [muniSel, setMuniSel] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [sortField, setSortField] = useState<SortField>('fecha');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const barData = montoTotalPorMunicipalidad();
  const rubroData = useMemo(() => distribucionRubro(muniSel), [muniSel]);
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
      if (sortField === 'fecha') cmp = a.fecha.localeCompare(b.fecha);
      else if (sortField === 'monto') cmp = a.monto - b.monto;
      else cmp = a.proveedor.localeCompare(b.proveedor);
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
      ? <ChevronUp className="h-3 w-3 text-blue-600" />
      : <ChevronDown className="h-3 w-3 text-blue-600" />;
  }

  const topProveedor = concentracion[0];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Dashboard de Análisis Económico</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Órdenes de compra — relaciones económicas entre proveedores y municipalidades
            </p>
          </div>
          <select
            value={muniSel}
            onChange={e => setMuniSel(e.target.value)}
            className="text-sm border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todas las municipalidades</option>
            {MUNICIPALIDADES.map(m => (
              <option key={m} value={m}>{municiShort(m)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5 max-w-[1400px] mx-auto">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-500">Órdenes</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{ordenesFiltradas.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-500">Monto total</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{fmt(totalMonto)}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-500">Proveedores únicos</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{concentracion.length}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-500">Ticket promedio</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">
                {ordenesFiltradas.length > 0 ? fmt(totalMonto / ordenesFiltradas.length) : '$0'}
              </p>
            </div>
          </div>

          {/* Alerta concentración */}
          {topProveedor && topProveedor.pct >= 30 && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <span className="font-semibold">{topProveedor.proveedor}</span> concentra el{' '}
                <span className="font-semibold">{topProveedor.pct}%</span> del monto total transado
                {muniSel ? ` en ${municiShort(muniSel)}` : ''} ({topProveedor.contratos} contratos · {fmt(topProveedor.monto)}).
              </p>
            </div>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Bar chart — monto por municipalidad */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Monto transado por municipalidad</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${(v / 1_000_000).toFixed(0)}M`}
                    width={42}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                    formatter={(v) => [fmtFull(Number(v)), 'Monto']}
                  />
                  <Bar dataKey="monto" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={muniSel && `Municipalidad de ${entry.name}` !== muniSel ? '#e5e7eb' : '#2563eb'}
                        opacity={muniSel && `Municipalidad de ${entry.name}` !== muniSel ? 0.5 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart — distribución por rubro */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Distribución por rubro</p>
              <p className="text-xs text-gray-400 mb-3">
                {muniSel ? municiShort(muniSel) : 'Todas las municipalidades'}
              </p>
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
                      <Cell key={entry.name} fill={RUBRO_COLORS[entry.name] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
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
            </div>
          </div>

          {/* Concentración de proveedores */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Concentración de proveedores{muniSel ? ` — ${municiShort(muniSel)}` : ''}
            </p>
            <div className="space-y-2">
              {concentracion.slice(0, 8).map((p, i) => (
                <div key={p.rut} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm text-gray-800 truncate font-medium">{p.proveedor}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {p.contratos} OC · {fmt(p.monto)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className={cn(
                            'h-1.5 rounded-full',
                            p.pct >= 40 ? 'bg-red-500' : p.pct >= 25 ? 'bg-amber-400' : 'bg-blue-500',
                          )}
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          'text-xs font-semibold w-8 text-right flex-shrink-0',
                          p.pct >= 40 ? 'text-red-600' : p.pct >= 25 ? 'text-amber-600' : 'text-gray-600',
                        )}
                      >
                        {p.pct}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabla órdenes de compra */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Órdenes de compra</span>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar proveedor, organismo, descripción..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">ID</th>
                    <th
                      className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700"
                      onClick={() => toggleSort('proveedor')}
                    >
                      <span className="flex items-center gap-1">Proveedor <SortIcon field="proveedor" /></span>
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Organismo</th>
                    {!muniSel && (
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Municipalidad</th>
                    )}
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Descripción</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Rubro</th>
                    <th
                      className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700"
                      onClick={() => toggleSort('monto')}
                    >
                      <span className="flex items-center justify-end gap-1">Monto <SortIcon field="monto" /></span>
                    </th>
                    <th
                      className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700"
                      onClick={() => toggleSort('fecha')}
                    >
                      <span className="flex items-center gap-1">Fecha <SortIcon field="fecha" /></span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ordenesFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                        No hay órdenes que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    ordenesFiltradas.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-xs text-gray-400 font-mono whitespace-nowrap">{o.id}</td>
                        <td className="px-4 py-2.5 text-gray-900 whitespace-nowrap">
                          <div className="font-medium">{o.proveedor}</div>
                          <div className="text-xs text-gray-400">{o.rut}</div>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 text-xs whitespace-nowrap">{o.organismo}</td>
                        {!muniSel && (
                          <td className="px-4 py-2.5 text-gray-600 text-xs whitespace-nowrap">{municiShort(o.municipalidad)}</td>
                        )}
                        <td className="px-4 py-2.5 text-gray-700 max-w-[240px]">
                          <span className="line-clamp-2 text-xs leading-snug">{o.descripcion}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background: `${RUBRO_COLORS[o.rubro] ?? '#6b7280'}18`,
                              color: RUBRO_COLORS[o.rubro] ?? '#6b7280',
                            }}
                          >
                            {o.rubro}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900 whitespace-nowrap">
                          {fmt(o.monto)}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{o.fecha}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
              {ordenesFiltradas.length} orden{ordenesFiltradas.length !== 1 ? 'es' : ''} · total {fmt(totalMonto)} · datos de demostración 2024
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
