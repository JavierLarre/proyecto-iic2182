import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Cliente solo-lectura con la llave anon. Sirve tanto en server components
// como en el navegador (no persiste sesión: la app no autentica usuarios).
// Si las variables no están definidas (ej. build en Vercel sin configurar),
// las llamadas fallarán en runtime con un error claro, sin reventar el build.
export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder', {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const supabaseConfigured = Boolean(url && anonKey);
