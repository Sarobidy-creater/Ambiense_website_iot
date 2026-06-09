-- =========================================================
--  Schéma BDD partagée — Projet Bar Coupe du Monde · ISEP
--  Coller dans l'éditeur SQL Supabase puis exécuter
-- =========================================================

-- Table des appareils (capteurs et actionneurs de toutes les équipes)
create table if not exists devices (
  id          text primary key,              -- ex: 'G1E_temperature', 'G1E_ventilateur'
  team_code   text not null,                 -- ex: 'G1E', 'G2E', ...
  kind        text not null check (kind in ('sensor', 'actuator')),
  type        text not null,                 -- 'temperature' | 'sound' | 'light' | 'presence' | 'motor' | ...
  unit        text,                          -- '°C', 'dB', 'lux', '%', ...
  label       text,                          -- label lisible, ex: 'Capteur de température G1E'
  created_at  timestamptz default now()
);

-- Table des mesures (toutes équipes confondues)
create table if not exists measurements (
  id          bigint generated always as identity primary key,
  device_id   text references devices(id) on delete cascade,
  team_code   text not null,
  type        text not null,
  value       double precision not null,
  unit        text,
  created_at  timestamptz default now()
);
-- Index pour les requêtes typiques (type + tri temporal, device + tri temporal)
create index if not exists idx_meas_type_time   on measurements (type, created_at desc);
create index if not exists idx_meas_device_time on measurements (device_id, created_at desc);
create index if not exists idx_meas_team_time   on measurements (team_code, created_at desc);

-- Table des commandes envoyées aux actionneurs
create table if not exists commands (
  id          bigint generated always as identity primary key,
  device_id   text references devices(id) on delete cascade,
  team_code   text not null,
  action      text not null,                 -- 'set_speed' | 'on' | 'off'
  payload     jsonb,                         -- ex: {"speed": 75}
  status      text default 'pending' check (status in ('pending', 'done', 'error')),
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);
create index if not exists idx_cmd_device_status on commands (device_id, status);
create index if not exists idx_cmd_device_time   on commands (device_id, created_at desc);


-- =========================================================
--  Row Level Security (RLS)
-- =========================================================

-- Activer RLS sur les 3 tables
alter table devices      enable row level security;
alter table measurements enable row level security;
alter table commands     enable row level security;

-- ---- devices : lecture publique aux utilisateurs authentifiés ----
-- Toutes les équipes peuvent voir tous les appareils déclarés
create policy "devices_select_authenticated"
  on devices for select
  to authenticated
  using (true);

-- Seule la passerelle (service role) peut insérer/modifier des appareils
-- (pas de politique insert/update côté web = interdite par défaut)

-- ---- measurements : lecture pour tous les authentifiés ----
-- Chaque équipe voit les mesures des autres pour afficher le tableau de bord commun
create policy "measurements_select_authenticated"
  on measurements for select
  to authenticated
  using (true);

-- La passerelle insère les mesures avec la clé service (bypass RLS) ;
-- aucune politique d'insertion web pour éviter les faux relevés.

-- ---- commands : lecture pour tous les authentifiés ----
create policy "commands_select_authenticated"
  on commands for select
  to authenticated
  using (true);

-- Un utilisateur authentifié peut insérer une commande.
-- La colonne created_by est forcée à auth.uid() par la politique.
create policy "commands_insert_authenticated"
  on commands for insert
  to authenticated
  with check (created_by = auth.uid());

-- Seule la passerelle (service role) peut mettre à jour le statut d'une commande.
