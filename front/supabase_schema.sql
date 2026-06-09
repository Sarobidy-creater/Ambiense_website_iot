-- =========================================================
--  Schema BDD equipe G1E — Bar Coupe du Monde · ISEP
--  IMPORTANT : les noms entre guillemets doubles preservent
--  la casse (PostgreSQL) — ne pas modifier.
--  Copier-coller dans Supabase SQL Editor et executer.
-- =========================================================

-- ─── TABLES G1E ───────────────────────────────────────────

create table if not exists "G1E_devices" (
  id          text primary key,   -- 'G1E_temperature', 'G1E_ventilateur', 'G1E_humidity'
  kind        text not null,       -- 'sensor' | 'actuator'
  type        text not null,       -- 'temperature' | 'humidity' | 'motor'
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
  action      text not null,           -- 'set_speed' | 'on' | 'off'
  payload     jsonb,                   -- ex: {"speed": 75}
  status      text default 'pending',  -- 'pending' | 'done' | 'error'
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);
create index if not exists "idx_G1E_cmd_device_status"
  on "G1E_commands" (device_id, status);


-- ─── ROW LEVEL SECURITY ───────────────────────────────────

alter table "G1E_devices"      enable row level security;
alter table "G1E_measurements" enable row level security;
alter table "G1E_commands"     enable row level security;

-- Lecture devices : tout utilisateur authentifie
create policy "G1E_devices_select" on "G1E_devices"
  for select to authenticated using (true);

-- Ecriture devices : service_role uniquement (passerelle / admin)
create policy "G1E_devices_insert" on "G1E_devices"
  for insert to service_role with check (true);

-- Lecture mesures : tout utilisateur authentifie
create policy "G1E_measurements_select" on "G1E_measurements"
  for select to authenticated using (true);

-- Insertion mesures : service_role uniquement (passerelle)
create policy "G1E_measurements_insert" on "G1E_measurements"
  for insert to service_role with check (true);

-- Lecture commandes : propre utilisateur uniquement
create policy "G1E_commands_select" on "G1E_commands"
  for select to authenticated using (created_by = auth.uid());

-- Insertion commandes : utilisateur authentifie
create policy "G1E_commands_insert" on "G1E_commands"
  for insert to authenticated with check (created_by = auth.uid());

-- Mise a jour statut : service_role uniquement (passerelle)
create policy "G1E_commands_update" on "G1E_commands"
  for update to service_role using (true) with check (true);


-- ─── APPAREILS G1E ────────────────────────────────────────
-- Capteur DHT15 (SEN-KY015TF) : temperature + humidite
-- Actionneur : Servo S148 Futaba (ventilateur)

insert into "G1E_devices" (id, kind, type, unit, label) values
  ('G1E_temperature', 'sensor',   'temperature', '°C', 'Capteur DHT15 — temperature bar G1E'),
  ('G1E_humidity',    'sensor',   'humidity',    '%',  'Capteur DHT15 — humidite bar G1E'),
  ('G1E_ventilateur', 'actuator', 'motor',       NULL, 'Servo S148 Futaba — ventilateur bar G1E')
on conflict (id) do nothing;


-- ─── MESURES DEMO (courbe soiree sur 2h) ──────────────────

-- Temperature : montee progressive 22°C → 28°C avec bruit
insert into "G1E_measurements" (device_id, type, value, unit, created_at)
select
  'G1E_temperature', 'temperature',
  22.0 + (row_number() over () * 0.22) + (random() * 0.5 - 0.25),
  '°C',
  now() - interval '120 minutes' + (row_number() over () * interval '4 minutes')
from generate_series(1, 30) s;

-- Humidite : descend de 65% a 48% au fil de la soiree
insert into "G1E_measurements" (device_id, type, value, unit, created_at)
select
  'G1E_humidity', 'humidity',
  65.0 - (row_number() over () * 0.55) + (random() * 2 - 1),
  '%',
  now() - interval '120 minutes' + (row_number() over () * interval '4 minutes')
from generate_series(1, 30) s;