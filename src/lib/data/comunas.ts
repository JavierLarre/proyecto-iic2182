import { supabase } from '@/lib/supabase';

/** Catálogo de comunas para la cascada región→comuna (cod + nombre + región corta). */
export interface ComunaRef { cod: number; nombre: string; region: string }

export async function fetchComunasRef(): Promise<ComunaRef[]> {
  const { data, error } = await supabase.rpc('comunas_ref');
  if (error) throw new Error(error.message);
  return (data ?? []) as ComunaRef[];
}
