// =========================================================
//  Client Supabase — instance unique pour toute l'app
// =========================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Affiche un message clair dans la console si les variables manquent
// (ne crash pas pour éviter l'écran noir)
if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[AMBIENSE] ⚠️  Variables Supabase manquantes.\n' +
    'Créez front/.env.local avec :\n' +
    '  VITE_SUPABASE_URL=https://...\n' +
    '  VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...\n' +
    'Voir front/.env.local.example pour le modèle complet.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/** Code de notre équipe, lu depuis les variables d'env */
export const TEAM_CODE = (import.meta.env.VITE_TEAM_CODE as string) || 'G1E';

/** Activer le Realtime Supabase (sinon polling) */
export const USE_REALTIME = import.meta.env.VITE_USE_REALTIME === 'true';

/** IDs de nos appareils (capteur DHT15 + servo S148) */
export const OUR_DEVICES = {
  temperature: `${TEAM_CODE}_temperature`,
  humidity:    `${TEAM_CODE}_humidity`,
  ventilateur: `${TEAM_CODE}_ventilateur`,
} as const;
