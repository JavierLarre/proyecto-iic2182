'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  licitaciones,
  calcularTendencia,
  REGIONES,
  CATEGORIAS,
  type EstadoLicitacion,
} from '@/data/licitaciones';
import { Search, TrendingUp, List, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const ESTADO_LABELS: Record<EstadoLicitacion, string> = {
  publicada: 'Publicada',
  adjudicada: 'Adjudicada',
  desierta: 'Desierta',
};

const ESTADO_COLORS: Record<EstadoLicitacion, string> = {
  publicada: 'bg-blue-100 text-blue-700',
  adjudicada: 'bg-green-100 text-green-700',
  desierta: 'bg-red-100 text-red-700',
};

type SortField = 'fechaPublicacion' | 'monto' | 'nombre';
type SortDir = 'asc' | 'desc';
type MetricMode = 'cantidad' | 'monto';

function formatMonto(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function formatMes(mes: string) {
  const [year, month] = mes.split('-');
  const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${names[parseInt(month) - 1]} ${year.slice(2)}`;
}

export default function LicitacionesPage() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoLicitacion | ''>('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroRegion, setFiltroRegion] = useState('');
  const [sortField, setSortField] = useState<SortField>('fechaPublicacion');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [metrica, setMetrica] = useState<MetricMode>('cantidad');

  const filtradas = useMemo(() => {
    let result = licitaciones;
    if (filtroEstado) result = result.filter(l => l.estado === filtroEstado);
    if (filtroCategoria) result = result.filter(l => l.categoria === filtroCategoria);
    if (filtroRegion) result = result.filter(l => l.region === filtroRegion);
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      result = result.filter(
        l =>
          l.nombre.toLowerCase().includes(q) ||
          l.organismo.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q),
      );
    }
    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'fechaPublicacion') cmp = a.fechaPublicacion.localeCompare(b.fechaPublicacion);
      else if (sortField === 'monto') cmp = a.monto - b.monto;
      else cmp = a.nombre.localeCompare(b.nombre);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [busqueda, filtroEstado, filtroCategoria, filtroRegion, sortField, sortDir]);

  const tendencia = useMemo(() => calcularTendencia(filtradas), [filtradas]);

  const stats = useMemo(() => {
    const total = filtradas.length;
    const montoTotal = filtradas.reduce((s, l) => s + l.monto, 0);
    const publicadas = filtradas.filter(l => l.estado === 'publicada').length;
    const adjudicadas = filtradas.filter(l => l.estado === 'adjudicada').length;
    const desiertas = filtradas.filter(l => l.estado === 'desierta').length;
    return { total, montoTotal, publicadas, adjudicadas, desiertas };
  }, [filtradas]);

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

  const chartData = tendencia.map(t => ({ ...t, mes: formatMes(t.mes) }));

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <h1 className="text-lg font-semibold text-gray-900">Monitor de Licitaciones</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Mercado Público — predicción de mercado y monitoreo de oportunidades
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5 max-w-[1400px] mx-auto">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total', value: stats.total, color: 'text-gray-900' },
              { label: 'Publicadas', value: stats.publicadas, color: 'text-blue-600' },
              { label: 'Adjudicadas', value: stats.adjudicadas, color: 'text-green-600' },
              { label: 'Desiertas', value: stats.desiertas, color: 'text-red-600' },
              { label: 'Monto Total', value: formatMonto(stats.montoTotal), color: 'text-gray-900' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-lg border border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-500">{label}</p>
                <p className={cn('text-xl font-bold mt-0.5', color)}>{value}</p>
              </div>
            ))}
          </div>

          {/* Gráfico tendencia */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Tendencia temporal — licitaciones {filtroEstado || 'todos los estados'}{filtroCategoria ? ` · ${filtroCategoria}` : ''}{filtroRegion ? ` · ${filtroRegion}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setMetrica('cantidad')}
                  className={cn('text-xs px-2 py-1 rounded transition-colors', metrica === 'cantidad' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700')}
                >
                  Cantidad
                </button>
                <button
                  onClick={() => setMetrica('monto')}
                  className={cn('text-xs px-2 py-1 rounded transition-colors', metrica === 'monto' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700')}
                >
                  Monto (MM$)
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(value) =>
                    metrica === 'monto' ? [`${value} MM$`, 'Monto'] : [`${value}`, 'Licitaciones']
                  }
                />
                <Line
                  type="monotone"
                  dataKey={metrica}
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#2563eb' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Filtros + tabla */}
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Filtros */}
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="flex items-center gap-2">
                <List className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">Filtros</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Búsqueda */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, organismo o ID..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                {/* Estado */}
                <select
                  value={filtroEstado}
                  onChange={e => setFiltroEstado(e.target.value as EstadoLicitacion | '')}
                  className="text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Todos los estados</option>
                  {(Object.keys(ESTADO_LABELS) as EstadoLicitacion[]).map(e => (
                    <option key={e} value={e}>{ESTADO_LABELS[e]}</option>
                  ))}
                </select>
                {/* Categoría */}
                <select
                  value={filtroCategoria}
                  onChange={e => setFiltroCategoria(e.target.value)}
                  className="text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Todas las categorías</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {/* Región */}
                <select
                  value={filtroRegion}
                  onChange={e => setFiltroRegion(e.target.value)}
                  className="text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Todas las regiones</option>
                  {REGIONES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {(filtroEstado || filtroCategoria || filtroRegion || busqueda) && (
                  <button
                    onClick={() => { setFiltroEstado(''); setFiltroCategoria(''); setFiltroRegion(''); setBusqueda(''); }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline px-1"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">ID</th>
                    <th
                      className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
                      onClick={() => toggleSort('nombre')}
                    >
                      <span className="flex items-center gap-1">Nombre <SortIcon field="nombre" /></span>
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Organismo</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Categoría</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Región</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
                    <th
                      className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
                      onClick={() => toggleSort('monto')}
                    >
                      <span className="flex items-center justify-end gap-1">Monto <SortIcon field="monto" /></span>
                    </th>
                    <th
                      className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700"
                      onClick={() => toggleSort('fechaPublicacion')}
                    >
                      <span className="flex items-center gap-1">Publicación <SortIcon field="fechaPublicacion" /></span>
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Cierre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtradas.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                        No hay licitaciones que coincidan con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filtradas.map(l => (
                      <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-xs text-gray-400 font-mono whitespace-nowrap">{l.id}</td>
                        <td className="px-4 py-2.5 text-gray-900 max-w-[260px]">
                          <span className="line-clamp-2 leading-snug">{l.nombre}</span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap max-w-[160px]">
                          <span className="truncate block">{l.organismo}</span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap text-xs">{l.categoria}</td>
                        <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap text-xs">{l.region}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', ESTADO_COLORS[l.estado])}>
                            {ESTADO_LABELS[l.estado]}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900 whitespace-nowrap">
                          {formatMonto(l.monto)}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{l.fechaPublicacion}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{l.fechaCierre}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
              {filtradas.length} licitación{filtradas.length !== 1 ? 'es' : ''} · datos de demostración Mercado Público 2024–2025
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
