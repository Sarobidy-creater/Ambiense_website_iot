-- =========================================================
--  Schéma BDD équipe G1E — projet bar Coupe du Monde · ISEP
--  Chaque équipe crée ses propres tables (nomenclature G1X_*)
--  Coller dans l'éditeur SQL Supabase (une seule fois)
-- =========================================================

-- ─── TABLES G1E ───────────────────────────────────────────

create table if not exists G1E_devices (
  id          text primary key,        -- ex: 'G1E_temperature', 'G1E_ventilateur'
  kind        text not null,           -- 'sensor' | 'actuator'
  type        text not null,           -- 'temperature' | 'motor'
  unit        text,
  label       text,
  created_at  timestamptz default now()
);

create table if not exists G1E_measurements (
  id          bigint generated always as identity primary key,
  device_id   text references G1E_devices(id),
  type        text not null,
  value       double precision not null,
  unit        text,
  created_at  timestamptz default now()
);
create index if not exists idx_G1E_meas_type_time   on G1E_measurements (type, created_at desc);
create index if not exists idx_G1E_meas_device_time on G1E_measurements (device_id, created_at desc);

create table if not exists G1E_commands (
  id          bigint generated always as identity primary key,
  device_id   text references G1E_devices(id),
  action      text not null,                -- 'set_speed' | 'on' | 'off'
  payload     jsonb,                        -- ex: {"speed": 75}
  status      text default 'pending',       -- 'pending' | 'done' | 'error'
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);
create index if not exists idx_G1E_cmd_device_status on G1E_commands (device_id, status);


-- ─── ROW LEVEL SECURITY ───────────────────────────────────

alter table G1E_devices      enable row level security;
alter table G1E_measurements enable row level security;
alter table G1E_commands     enable row level security;

-- G1E_devices : tout utilisateur authentifié peut lire
create policy "G1E — Lecture devices — utilisateurs authentifiés"
  on G1E_devices for select
  to authenticated
  using (true);

-- G1E_devices : seul le rôle service_role peut écrire (passerelle/admin)
create policy "G1E — Écriture devices — service uniquement"
  on G1E_devices for insert
  to service_role
  with check (true);

-- G1E_measurements : lecture par tout utilisateur authentifié
create policy "G1E — Lecture mesures — utilisateurs authentifiés"
  on G1E_measurements for select
  to authenticated
  using (true);

-- G1E_measurements : insertion réservée au service_role (passerelle)
create policy "G1E — Insertion mesures — service uniquement"
  on G1E_measurements for insert
  to service_role
  with check (true);

-- G1E_commands : lecture des commandes de l'utilisateur connecté
create policy "G1E — Lecture commandes — propres commandes"
  on G1E_commands for select
  to authenticated
  using (created_by = auth.uid());

-- G1E_commands : un utilisateur authentifié peut insérer une commande
create policy "G1E — Insertion commandes — utilisateurs authentifiés"
  on G1E_commands for insert
  to authenticated
  with check (created_by = auth.uid());

-- G1E_commands : mise à jour du statut réservée au service_role (passerelle)
create policy "G1E — Mise à jour statut — service uniquement"
  on G1E_commands for update
  to service_role
  using (true)
  with check (true);


-- ─── APPAREILS G1E ────────────────────────────────────────

insert into G1E_devices (id, kind, type, unit, label) values
  ('G1E_temperature', 'sensor',   'temperature', '°C', 'Capteur température bar G1E'),
  ('G1E_ventilateur', 'actuator', 'motor',       NULL, 'Ventilateur bar G1E')
on conflict (id) do nothing;


-- ─── MESURES FICTIVES G1E (~ 12 lignes sur 2 heures) ──────

-- G1E température — montée progressive comme pendant un match
insert into G1E_measurements (device_id, type, value, unit, created_at)
select
  'G1E_temperature', 'temperature',
  21.5 + (row_number() over () * 0.18) + (random() * 0.4 - 0.2),
  '°C',
  now() - interval '120 minutes' + (row_number() over () * interval '10 minutes')
from generate_series(1, 12) s;
