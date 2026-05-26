// Formateo de montos CLP y fechas para las vistas de datos reales.

/** Monto CLP compacto: billón = 10^12 (convención chilena). */
export function fmtCLP(n: number): string {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  if (a >= 1e12) return `$${(v / 1e12).toLocaleString('es-CL', { maximumFractionDigits: 1 })} bill.`;
  if (a >= 1e9) return `$${(v / 1e9).toLocaleString('es-CL', { maximumFractionDigits: 1 })} mil M`;
  if (a >= 1e6) return `$${(v / 1e6).toLocaleString('es-CL', { maximumFractionDigits: 1 })} M`;
  if (a >= 1e3) return `$${(v / 1e3).toLocaleString('es-CL', { maximumFractionDigits: 0 })} mil`;
  return `$${Math.round(v).toLocaleString('es-CL')}`;
}

/** Monto completo con separadores de miles. */
export function fmtCLPFull(n: number): string {
  return `$${Math.round(Number(n) || 0).toLocaleString('es-CL')}`;
}

/** Entero con separadores de miles. */
export function fmtInt(n: number): string {
  return (Number(n) || 0).toLocaleString('es-CL');
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** "2026-03-01" → "Mar 26" */
export function fmtMesCorto(isoDate: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return `${MESES[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
}

/** "2026-03-05T..." → "05-03-2026" */
export function fmtFecha(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getUTCFullYear()}`;
}
