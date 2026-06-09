// =========================================================
//  Client Supabase — instance unique pour toute l'app
// =========================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Variables VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY manquantes dans .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/** Code de notre équipe, lu depuis les variables d'env */
export const TEAM_CODE = (import.meta.env.VITE_TEAM_CODE as string) || 'G1E';

/** Activer le Realtime Supabase (sinon polling) */
export const USE_REALTIME = import.meta.env.VITE_USE_REALTIME === 'true';

/** IDs de nos appareils */
export const OUR_DEVICES = {
  temperature: `${TEAM_CODE}_temperature`,
  ventilateur: `${TEAM_CODE}_ventilateur`,
} as const;
