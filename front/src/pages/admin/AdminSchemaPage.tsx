// =========================================================
//  AdminSchemaPage — schéma SQL à exécuter dans Supabase
//  Affiche le SQL du fichier + instructions pas à pas
// =========================================================
import { useState } from 'react';
import styles from './AdminPage.module.css';

const SQL = `-- =========================================================
--  Schema BDD equipe G1E — Bar Coupe du Monde · ISEP
--  Copier-coller dans Supabase SQL Editor et executer.
-- =========================================================

create table if not exists "G1E_devices" (
  id          text primary key,
  kind        text not null,
  type        text not null,
  unit        text,
  label       text,
  created_at  timestamptz default now()
);

create table if not exists "G1E_measurements" (
  id          bigint generated always as identity primary key,
  device_id   text references "G1E_devices"(id) on delete cascade,
  type        text not null,
  value       double precision not null,
  unit        text,
  created_at  timestamptz default now()
);
create index if not exists "idx_G1E_meas_type_time"
  on "G1E_measurements" (type, created_at desc);
create index if not exists "idx_G1E_meas_device_time"
  on "G1E_measurements" (device_id, created_at desc);

create table if not exists "G1E_commands" (
  id          bigint generated always as identity primary key,
  device_id   text references "G1E_devices"(id) on delete cascade,
  action      text not null,
  payload     jsonb,
  status      text default 'pending',
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);
create index if not exists "idx_G1E_cmd_device_status"
  on "G1E_commands" (device_id, status);

-- RLS
alter table "G1E_devices"      enable row level security;
alter table "G1E_measurements" enable row level security;
alter table "G1E_commands"     enable row level security;

create policy "G1E_devices_select"      on "G1E_devices"
  for select to authenticated using (true);
create policy "G1E_devices_insert"      on "G1E_devices"
  for insert to service_role with check (true);
create policy "G1E_measurements_select" on "G1E_measurements"
  for select to authenticated using (true);
create policy "G1E_measurements_insert" on "G1E_measurements"
  for insert to service_role with check (true);
create policy "G1E_commands_select"     on "G1E_commands"
  for select to authenticated using (created_by = auth.uid());
create policy "G1E_commands_insert"     on "G1E_commands"
  for insert to authenticated with check (created_by = auth.uid());
create policy "G1E_commands_update"     on "G1E_commands"
  for update to service_role using (true) with check (true);

-- Appareils G1E (DHT15 + Servo S148)
insert into "G1E_devices" (id, kind, type, unit, label) values
  ('G1E_temperature', 'sensor',   'temperature', '°C', 'Capteur DHT15 — température'),
  ('G1E_humidity',    'sensor',   'humidity',    '%',  'Capteur DHT15 — humidité'),
  ('G1E_ventilateur', 'actuator', 'motor',       null, 'Servo S148 Futaba — ventilateur')
on conflict (id) do nothing;

-- Table partenaire G1C — fumée en ppm
create table if not exists "g1c_smoke" (
  id          bigint generated always as identity primary key,
  ppm         double precision not null,
  measured_at timestamptz default now()
);
create index if not exists "idx_g1c_smoke_measured_at"
  on "g1c_smoke" (measured_at desc);

alter table "g1c_smoke" enable row level security;

drop policy if exists "g1c_smoke_select" on "g1c_smoke";
create policy "g1c_smoke_select" on "g1c_smoke"
  for select to authenticated using (true);`;

const STEPS = [
  { n: 1, text: 'Ouvrir Supabase → votre projet → SQL Editor' },
  { n: 2, text: 'Cliquer "New query"' },
  { n: 3, text: 'Copier le SQL ci-dessous et coller dans l\'éditeur' },
  { n: 4, text: 'Cliquer "Run" (F5)' },
  { n: 5, text: 'Vérifier dans Table Editor que G1E_devices, G1E_measurements, G1E_commands et g1c_smoke sont créées' },
];

export function AdminSchemaPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.pageEye}>Administration</p>
        <h1 className={styles.pageTitle}>Schéma SQL</h1>
        <p className={styles.pageSub}>
          Tables G1E + table partenaire G1C smoke — à exécuter une seule fois dans Supabase SQL Editor
        </p>
      </header>

      {/* Étapes */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Procédure</h2>
        <ol style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', paddingLeft: 0, listStyle: 'none' }}>
          {STEPS.map(s => (
            <li key={s.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-4)' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.7rem',
                color: 'var(--clr-or)',
                border: '1px solid rgba(201,162,64,0.35)',
                padding: '1px 7px',
                flexShrink: 0,
                lineHeight: 1.8,
              }}>
                {String(s.n).padStart(2, '0')}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--clr-text-muted)', paddingTop: 2 }}>
                {s.text}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Bloc SQL */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>SQL complet</h2>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleCopy}>
            {copied ? 'Copié !' : 'Copier le SQL'}
          </button>
        </div>
        <pre className={styles.sqlBlock}>{SQL}</pre>
      </section>

      {/* Note importante */}
      <aside style={{
        background: 'rgba(201,162,64,0.06)',
        borderLeft: '2px solid var(--clr-or)',
        padding: 'var(--sp-5) var(--sp-6)',
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        color: 'var(--clr-text-muted)',
        lineHeight: 1.7,
      }}>
        <strong style={{ color: 'var(--clr-or)', display: 'block', marginBottom: 'var(--sp-2)' }}>
          Pourquoi les guillemets doubles ?
        </strong>
        PostgreSQL convertit les identifiants sans guillemets en minuscules.
        Les guillemets doubles (<code style={{ color: 'var(--clr-or)', fontSize: '0.8em' }}>"G1E_devices"</code>)
        forcent la casse exacte, ce qui permet au client Supabase de trouver les tables.
      </aside>
    </div>
  );
}
