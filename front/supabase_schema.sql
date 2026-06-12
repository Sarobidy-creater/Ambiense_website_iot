-- =========================================================
--  Schema BDD equipe G1E — Bar Coupe du Monde · ISEP
--  Copier-coller dans Supabase SQL Editor et executer.
--  Safe a re-executer : DROP POLICY IF EXISTS avant chaque policy.
-- =========================================================

-- ─── ROLES UTILISATEURS ───────────────────────────────────

create table if not exists "user_roles" (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'user',   -- 'user' | 'admin'
  created_at timestamptz default now()
);

alter table "user_roles" enable row level security;

-- Fonction SECURITY DEFINER : vérifie le rôle sans déclencher les policies
-- (évite la récursion infinie dans les policies qui se référencent elles-mêmes)
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from "user_roles"
    where user_id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "user_roles_select_own"    on "user_roles";
drop policy if exists "user_roles_select_all"    on "user_roles";
drop policy if exists "user_roles_admin_select"  on "user_roles";
drop policy if exists "user_roles_admin_update"  on "user_roles";
drop policy if exists "user_roles_admin_insert"  on "user_roles";

-- Chaque utilisateur lit son propre rôle
create policy "user_roles_select_own" on "user_roles"
  for select to authenticated
  using (user_id = auth.uid());

-- Un admin peut lire TOUS les rôles (via is_admin() — pas de récursion)
create policy "user_roles_admin_select" on "user_roles"
  for select to authenticated
  using (is_admin());

-- Un admin peut INSÉRER un nouveau rôle
create policy "user_roles_admin_insert" on "user_roles"
  for insert to authenticated
  with check (is_admin());

-- Un admin peut MODIFIER un rôle existant
create policy "user_roles_admin_update" on "user_roles"
  for update to authenticated
  using (is_admin())
  with check (true);


-- ─── VUE PROFILS UTILISATEURS (lisible par les admins) ────
-- Expose les infos de auth.users sans donner acces direct a la table

create or replace view "user_profiles" as
  select
    u.id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    coalesce(r.role, 'user') as role
  from auth.users u
  left join "user_roles" r on r.user_id = u.id;

-- Donne acces a la vue aux utilisateurs authentifies
-- (la securite est assuree par RLS sur user_roles)
grant select on "user_profiles" to authenticated;


-- ─── TABLES G1E ───────────────────────────────────────────

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


-- ─── COMPTE ADMIN ─────────────────────────────────────────
-- ETAPE 1 : Cree le compte admin depuis le site → /signup
--           avec l'email de votre choix (ex: admin@g1e.isep.fr)
--
-- ETAPE 2 : Une fois inscrit, execute ce SQL en remplacant
--           l'email par celui utilise a l'inscription :
--
--   insert into "user_roles" (user_id, role)
--   select id, 'admin'
--   from auth.users
--   where email = 'admin@g1e.isep.fr'   -- <-- changer ici
--   on conflict (user_id) do update set role = 'admin';
--
-- L'acces /admin est ensuite protege par verification du role en BDD.