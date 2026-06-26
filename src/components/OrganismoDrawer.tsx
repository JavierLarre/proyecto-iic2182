'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Building2, Receipt, TrendingUp, Award, Users, Tag, Copy, Loader2, FileSearch,
} from 'lucide-react';
import { DetailDrawer, Skeleton } from '@/components/ui';
import { fmtCLP, fmtCLPFull, fmtInt } from '@/lib/format';
import { fetchOrganismoPerfil, type OrganismoPerfil } from '@/lib/data/dashboard';

/**
 * Drawer reutilizable con el perfil de un organismo comprador: gasto en OC,
 * comportamiento en licitaciones (tasa de adjudicación), a quién le compra y
 * qué rubros. Carga el perfil on-open por RUT.
 */
export function OrganismoDrawer({
  rut, nombreInicial, onClose, onVerOrdenes, onVerLicitaciones,
}: {
  rut: string | null;
  nombreInicial?: string | null;
  onClose: () => void;
  onVerOrdenes?: (rut: string, nombre: string | null) => void;
  onVerLicitaciones?: (rut: string, nombre: string | null) => void;
}) {
  const [perfil, setPerfil] = useState<OrganismoPerfil | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!rut) { setPerfil(null); return; }
    let alive = true; setLoading(true); setPerfil(null);
    fetchOrganismoPerfil(rut)
      .then((p) => { if (alive) { setPerfil(p); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [rut]);

  const nombre = perfil?.nombre ?? nombreInicial ?? 'Organismo';

  return (
    <DetailDrawer open={rut !== null} onClose={onClose} title={nombre} subtitle={rut ?? undefined} size="xl">
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {perfil && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              <Building2 className="h-3.5 w-3.5" /> Organismo comprador
            </span>
          </div>

          {/* Gasto en órdenes */}
          <div className="rounded-[8px] bg-background px-4 py-3">
            <p className="text-label text-app-text/40">Gasto en órdenes de compra</p>
            <p className="text-2xl font-bold text-app-text mt-0.5">{fmtCLPFull(perfil.oc.monto)}</p>
            <p className="text-xs text-app-text/50 mt-0.5">{fmtInt(perfil.oc.n_ordenes)} órdenes · ticket {fmtCLP(perfil.oc.ticket)}</p>
          </div>

          {/* Comportamiento en licitaciones */}
          <div>
            <p className="text-label text-app-text/40 mb-2 flex items-center gap-1.5"><Award className="h-3.5 w-3.5" /> Comportamiento en licitaciones</p>
            <div className="grid grid-cols-4 gap-2">
              <MiniStat label="Tasa adj." value={`${perfil.lic.tasa_adjudicacion}%`} accent />
              <MiniStat label="Total" value={fmtInt(perfil.lic.n_total)} />
              <MiniStat label="Adjudic." value={fmtInt(perfil.lic.n_adjudicada)} />
              <MiniStat label="Desiertas" value={fmtInt(perfil.lic.n_desierta)} />
            </div>
          </div>

          {/* Top rubros que compra */}
          {perfil.top_rubros.length > 0 && (
            <div>
              <p className="text-label text-app-text/40 mb-2 flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> Qué compra (rubros frecuentes)</p>
              <div className="flex flex-wrap gap-1.5">
                {perfil.top_rubros.map((r) => (
                  <span key={r.rubro} className="text-xs bg-surface border border-borders rounded-full px-2.5 py-1 text-app-text/70">
                    {r.rubro} <span className="text-app-text/40">· {fmtInt(r.n)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Top proveedores a los que compra */}
          {perfil.top_proveedores.length > 0 && (
            <div>
              <p className="text-label text-app-text/40 mb-2 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> A quién le compra</p>
              <div className="space-y-1.5">
                {perfil.top_proveedores.map((p, i) => (
                  <div key={(p.rut ?? '') + i} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-app-text truncate">{p.nombre ?? p.rut ?? '—'}</span>
                    <span className="text-xs text-app-text/50 flex-shrink-0">{fmtCLP(p.monto)} · {fmtInt(p.n)} OC</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-col gap-2 pt-2 border-t border-borders">
            <button onClick={() => { navigator.clipboard?.writeText(perfil.rut); toast.success('RUT copiado'); }}
              className="flex items-center justify-center gap-2 rounded-[8px] border border-borders bg-surface px-4 py-2 text-sm font-medium text-app-text hover:bg-background transition-colors">
              <Copy className="h-4 w-4" strokeWidth={1.5} /> Copiar RUT
            </button>
            {onVerOrdenes && (
              <button onClick={() => onVerOrdenes(perfil.rut, perfil.nombre)}
                className="flex items-center justify-center gap-2 rounded-[8px] border border-borders bg-surface px-4 py-2 text-sm font-medium text-app-text hover:bg-background transition-colors">
                <Receipt className="h-4 w-4" strokeWidth={1.5} /> Ver sus órdenes
              </button>
            )}
            {onVerLicitaciones && (
              <button onClick={() => onVerLicitaciones(perfil.rut, perfil.nombre)}
                className="flex items-center justify-center gap-2 rounded-[8px] bg-primary px-4 py-2 text-sm font-medium text-surface hover:bg-primary-hover transition-colors">
                <FileSearch className="h-4 w-4" strokeWidth={1.5} /> Ver sus licitaciones
              </button>
            )}
          </div>
        </div>
      )}

      {!loading && !perfil && rut && (
        <div className="flex items-center gap-2 text-sm text-app-text/50 py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      )}
    </DetailDrawer>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-background rounded-[8px] px-2 py-1.5 text-center">
      <p className="text-label text-app-text/40">{label}</p>
      <p className={`text-sm font-bold mt-0.5 ${accent ? 'text-primary' : 'text-app-text'}`}>{value}</p>
    </div>
  );
}
