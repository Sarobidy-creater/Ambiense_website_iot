// =========================================================
//  AdminDevicesPage — CRUD appareils G1E_devices
// =========================================================
import { useState, type FormEvent } from 'react';
import { useAdminDevices, type DeviceForm } from '../../hooks/useAdmin';
import styles from './AdminPage.module.css';

const EMPTY: DeviceForm = { id: '', kind: 'sensor', type: 'temperature', unit: '', label: '' };

export function AdminDevicesPage() {
  const { devices, loading, saving, error, create, update, remove } = useAdminDevices();
  const [form,    setForm]    = useState<DeviceForm>(EMPTY);
  const [editId,  setEditId]  = useState<string | null>(null);
  const [msg,     setMsg]     = useState<{ text: string; ok: boolean } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = editId
      ? await update(editId, { kind: form.kind, type: form.type, unit: form.unit, label: form.label })
      : await create(form);
    if (err) flash(err, false);
    else {
      flash(editId ? 'Appareil mis a jour.' : 'Appareil cree.', true);
      setForm(EMPTY);
      setEditId(null);
    }
  };

  const startEdit = (d: typeof devices[0]) => {
    setEditId(d.id);
    setForm({ id: d.id, kind: d.kind, type: d.type, unit: d.unit ?? '', label: d.label ?? '' });
  };

  const handleRemove = async (id: string) => {
    const err = await remove(id);
    if (err) flash(err, false);
    else { flash('Appareil supprime.', true); setConfirm(null); }
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.pageEye}>Administration</p>
        <h1 className={styles.pageTitle}>Appareils</h1>
        <p className={styles.pageSub}>Gestion des capteurs et actionneurs dans G1E_devices</p>
      </header>

      {/* Formulaire creation / edition */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {editId ? `Modifier — ${editId}` : 'Ajouter un appareil'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            {!editId && (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="dev-id">Identifiant</label>
                <input
                  id="dev-id"
                  className={styles.input}
                  value={form.id}
                  onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
                  placeholder="G1E_temperature"
                  required
                />
              </div>
            )}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="dev-kind">Classe</label>
              <select
                id="dev-kind"
                className={styles.select}
                value={form.kind}
                onChange={e => setForm(f => ({ ...f, kind: e.target.value as 'sensor' | 'actuator' }))}
              >
                <option value="sensor">Capteur (sensor)</option>
                <option value="actuator">Actionneur (actuator)</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="dev-type">Type</label>
              <input
                id="dev-type"
                className={styles.input}
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                placeholder="temperature"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="dev-unit">Unité</label>
              <input
                id="dev-unit"
                className={styles.input}
                value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                placeholder="°C"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="dev-label">Label</label>
              <input
                id="dev-label"
                className={styles.input}
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder="Capteur température G1E"
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>
              {saving ? 'Sauvegarde…' : editId ? 'Mettre a jour' : 'Creer'}
            </button>
            {editId && (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => { setForm(EMPTY); setEditId(null); }}
              >
                Annuler
              </button>
            )}
          </div>
          {msg && <p className={msg.ok ? styles.successMsg : styles.errorMsg}>{msg.text}</p>}
        </form>
      </section>

      {/* Liste appareils */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Appareils enregistrés ({devices.length})</h2>
        {loading ? (
          <p className={styles.stateMsg}>Chargement…</p>
        ) : (
          <>
            {error && <p className={styles.errorMsg}>{error}</p>}
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Identifiant</th>
                  <th>Classe</th>
                  <th>Type</th>
                  <th>Unité</th>
                  <th>Label</th>
                  <th>Créé le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(d => (
                  <tr key={d.id}>
                    <td><code className={styles.code}>{d.id}</code></td>
                    <td>
                      <span className={`${styles.badge} ${d.kind === 'sensor' ? styles.badgeTeal : styles.badgeOr}`}>
                        {d.kind}
                      </span>
                    </td>
                    <td>{d.type}</td>
                    <td>{d.unit ?? '—'}</td>
                    <td>{d.label ?? '—'}</td>
                    <td className={styles.mono}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <div className={styles.formActions}>
                        <button
                          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                          onClick={() => startEdit(d)}
                        >
                          Modifier
                        </button>
                        {confirm === d.id ? (
                          <>
                            <button
                              className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                              onClick={() => handleRemove(d.id)}
                              disabled={saving}
                            >
                              Confirmer
                            </button>
                            <button
                              className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
                              onClick={() => setConfirm(null)}
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <button
                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                            onClick={() => setConfirm(d.id)}
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  );
}