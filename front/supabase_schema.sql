-- =========================================================
--  Schema BDD equipe G1E — Bar Coupe du Monde · ISEP
--  Copier-coller dans Supabase SQL Editor et executer.
--  Safe a re-executer : DROP POLICY IF EXISTS avant chaque policy.
-- =========================================================

-- ─── TABLES ───────────────────────────────────────────────

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

-- ─── ROW LEVEL SECURITY ───────────────────────────────────

alter table "G1E_devices"      enable row level security;
alter table "G1E_measurements" enable row level security;
alter table "G1E_commands"     enable row level security;

-- DROP + CREATE pour etre idempotent (safe a re-executer)
drop policy if exists "G1E_devices_select"      on "G1E_devices";
drop policy if exists "G1E_devices_insert"      on "G1E_devices";
drop policy if exists "G1E_measurements_select" on "G1E_measurements";
drop policy if exists "G1E_measurements_insert" on "G1E_measurements";
drop policy if exists "G1E_commands_select"     on "G1E_commands";
drop policy if exists "G1E_commands_insert"     on "G1E_commands";
drop policy if exists "G1E_commands_update"     on "G1E_commands";

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

-- ─── APPAREILS G1E ────────────────────────────────────────

insert into "G1E_devices" (id, kind, type, unit, label) values
  ('G1E_temperature', 'sensor',   'temperature', '°C', 'Capteur DHT15 — temperature'),
  ('G1E_humidity',    'sensor',   'humidity',    '%',  'Capteur DHT15 — humidite'),
  ('G1E_ventilateur', 'actuator', 'motor',       null, 'Servo S148 Futaba — ventilateur')
on conflict (id) do nothing;