// =========================================================
//  DevicesPage — déclaration et visualisation des appareils
// =========================================================
import { useState } from 'react';
import { useDevices } from '../hooks/useDevices';
import { useMeasurements } from '../hooks/useMeasurements';
import { DeviceCard } from '../components/DeviceCard';
import { EmptyBaobab } from '../components/svg/EmptyBaobab';
import { supabase, TEAM_CODE } from '../lib/supabase';
import type { Device, Measurement } from '../lib/types';
import styles from './DevicesPage.module.css';

/** Associe chaque device_id à sa dernière mesure */
function buildLastMeasMap(measurements: Measurement[]): Map<string, Measurement> {
  const map = new Map<string, Measurement>();
  for (const m of measurements) {
    if (!map.has(m.device_id)) map.set(m.device_id, m);
  }
  return map;
}

/** Formulaire de déclaration d'un appareil G1E */
function RegisterDeviceForm({ onCreated }: { onCreated: () => void }) {
  const [id,      setId]      = useState('');
  const [kind,    setKind]    = useState<'sensor' | 'actuator'>('sensor');
  const [type,    setType]    = useState('temperature');
  const [unit,    setUnit]    = useState('°C');
  const [label,   setLabel]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fullId = id.startsWith(`${TEAM_CODE}_`) ? id : `${TEAM_CODE}_${id}`;
    setSaving(true);
    const { error: err } = await supabase.from('G1E_devices').insert({
      id: fullId, kind, type, unit: unit || null, label: label || null,
    } satisfies Partial<Device>);
    setSaving(false);
    if (err) setError(err.message);
    else { setSuccess(true); onCreated(); setTimeout(() => setSuccess(false), 3000); }
  };

  return (
    <form onSubmit={handle} className={styles.form} aria-labelledby="reg-title">
      <h3 id="reg-title" className={styles.formTitle}>Déclarer un appareil G1E</h3>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor="dev-id">Identifiant (sans préfixe)</label>
          <div className={styles.inputGroup}>
            <span className={styles.prefix}>{TEAM_CODE}_</span>
            <input id="dev-id" value={id} onChange={e => setId(e.target.value)}
              required placeholder="temperature" className={styles.inputSuffix} />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="dev-kind">Type d'appareil</label>
          <select id="dev-kind" value={kind} onChange={e => setKind(e.target.value as 'sensor' | 'actuator')}
            className={styles.select}>
            <option value="sensor">Capteur (sensor)</option>
            <option value="actuator">Actionneur (actuator)</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="dev-type">Catégorie</label>
          <input id="dev-type" value={type} onChange={e => setType(e.target.value)}
            required placeholder="temperature" className={styles.input} />
        </div>

        <div className={styles.field}>
          <label htmlFor="dev-unit">Unité (optionnel)</label>
          <input id="dev-unit" value={unit} onChange={e => setUnit(e.target.value)}
            placeholder="°C" className={styles.input} />
        </div>

        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label htmlFor="dev-label">Libellé (optionnel)</label>
          <input id="dev-label" value={label} onChange={e => setLabel(e.target.value)}
            placeholder="Capteur température bar G1E" className={styles.input} />
        </div>
      </div>

      {error   && <p className={styles.error}   role="alert">{error}</p>}
      {success && <p className={styles.success} role="status">Appareil créé !</p>}

      <button type="submit" className={styles.btn} disabled={saving}>
        {saving ? 'Enregistrement…' : 'Créer l\'appareil'}
      </button>
    </form>
  );
}

export function DevicesPage() {
  const [kindFilter, setKindFilter] = useState<string>('');

  const { devices, loading, error, refresh } = useDevices({
    kind: (kindFilter as 'sensor' | 'actuator') || undefined,
  });

  // Dernières mesures pour afficher le statut en ligne / hors ligne
  const { measurements } = useMeasurements({ limit: 300 });
  const lastMeasMap = buildLastMeasMap(measurements);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Appareils</h1>
          <p className={styles.subtitle}>Capteurs et actionneurs G1E</p>
        </div>
        <div className={styles.filters} role="group" aria-label="Filtres">
          <label className="sr-only" htmlFor="filter-kind">Filtrer par type</label>
          <select id="filter-kind" value={kindFilter} onChange={e => setKindFilter(e.target.value)}
            className={styles.filterSelect} aria-label="Capteur / actionneur">
            <option value="">Tous les types</option>
            <option value="sensor">Capteurs</option>
            <option value="actuator">Actionneurs</option>
          </select>
        </div>
      </header>

      {/* Enregistrement d'un nouvel appareil G1E */}
      <section className={styles.registerSection} aria-labelledby="register-section">
        <h2 id="register-section" className={styles.sectionTitle}>
          Enregistrer un capteur
        </h2>
        <RegisterDeviceForm onCreated={refresh} />
      </section>

      {/* Liste des appareils */}
      <section aria-label="Liste des appareils">
        {loading && (
          <p className={styles.stateMsg} role="status" aria-live="polite">
            Chargement des appareils…
          </p>
        )}
        {error && (
          <div className={styles.errorBanner} role="alert">
            Erreur : {error}
            <button onClick={refresh} className={styles.retryBtn}>Réessayer</button>
          </div>
        )}
        {!loading && !error && devices.length === 0 && (
          <div className={styles.empty}>
            <EmptyBaobab />
            <p>Aucun appareil trouvé</p>
          </div>
        )}
        <div className={styles.grid}>
          {devices.map(device => (
            <DeviceCard
              key={device.id}
              device={device}
              lastMeasurement={lastMeasMap.get(device.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
