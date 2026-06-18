// =========================================================
//  useThreshold — seuil thermique persisté dans G1E_settings
//  Lit le seuil au montage, fournit save() pour le persister.
//  La gateway relit cette valeur dynamiquement toutes les 5s.
// =========================================================
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULT_THRESHOLD = 28;

export function useThreshold() {
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [saving, setSaving]       = useState(false);
  const [loaded, setLoaded]       = useState(false);

  // Charge le seuil depuis Supabase au montage
  useEffect(() => {
    supabase
      .from('G1E_settings')
      .select('value_num')
      .eq('key', 'temp_threshold')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value_num != null) setThreshold(data.value_num);
        setLoaded(true);
      });
  }, []);

  // Persiste le seuil en base (upsert)
  const save = async (value: number): Promise<void> => {
    setSaving(true);
    await supabase.from('G1E_settings').upsert({
      key:       'temp_threshold',
      value_num: value,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
  };

  return { threshold, setThreshold, save, saving, loaded };
}
