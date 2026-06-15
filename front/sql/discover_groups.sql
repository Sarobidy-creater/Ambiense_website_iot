-- =========================================================
--  Fonctions RPC — Découverte dynamique des tables des
--  autres groupes (G1A, G1B, G1C, G1D)
--
--  À exécuter dans Supabase SQL Editor APRÈS schema.sql
-- =========================================================

-- ─── 1. Lister toutes les tables des groupes G1A-G1D ─────

create or replace function discover_group_tables()
returns table(
  group_prefix text,
  table_name   text,
  table_type   text   -- 'devices' | 'measurements' | 'commands' | 'other'
)
language sql
security definer
stable
set search_path = public
as $$
  select
    upper(regexp_replace(t.table_name, '_.*$', ''))::text as group_prefix,
    t.table_name::text,
    case
      when lower(t.table_name) like '%_devices'      then 'devices'
      when lower(t.table_name) like '%_measurements' then 'measurements'
      when lower(t.table_name) like '%_commands'     then 'commands'
      else                                                'other'
    end as table_type
  from information_schema.tables t
  where t.table_schema = 'public'
    and t.table_name ~* '^G1[ABCD]_'  -- insensible à la casse
  order by group_prefix, table_name;
$$;

grant execute on function discover_group_tables() to authenticated;


-- ─── 2. Récupérer les appareils d'un groupe ───────────────
--  Appel : select * from get_group_devices('G1A')
--  Retourne vide si la table n'existe pas.

create or replace function get_group_devices(group_prefix text)
returns table(
  id         text,
  kind       text,
  type       text,
  unit       text,
  label      text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  tname text;
begin
  -- Recherche insensible à la casse (certains groupes utilisent des minuscules)
  select t.table_name into tname
  from information_schema.tables t
  where t.table_schema = 'public'
    and lower(t.table_name) = lower(group_prefix || '_devices')
  limit 1;

  if tname is not null then
    return query execute format(
      'select id::text, kind::text, type::text, unit::text, label::text, created_at
       from %I
       order by id',
      tname
    );
  end if;
end;
$$;

grant execute on function get_group_devices(text) to authenticated;


-- ─── 3. Récupérer les dernières mesures d'un groupe ───────
--  Appel : select * from get_group_latest_measurements('G1A', 100)
--  Retourne vide si la table n'existe pas.

create or replace function get_group_latest_measurements(
  group_prefix text,
  row_limit    integer default 100
)
returns table(
  id         bigint,
  device_id  text,
  type       text,
  value      double precision,
  unit       text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  tname text;
begin
  -- Recherche insensible à la casse
  select t.table_name into tname
  from information_schema.tables t
  where t.table_schema = 'public'
    and lower(t.table_name) = lower(group_prefix || '_measurements')
  limit 1;

  if tname is not null then
    return query execute format(
      'select id, device_id::text, type::text, value::double precision, unit::text, created_at
       from %I
       order by created_at desc
       limit %s',
      tname, row_limit
    );
  end if;
end;
$$;

grant execute on function get_group_latest_measurements(text, integer) to authenticated;


-- ─── 4. Lire une table "non standard" de façon générique ──
--  Pour les groupes qui n'utilisent pas _devices/_measurements.
--  Essaie de lire les colonnes communes (valeur, date…).

create or replace function get_group_table_generic(
  table_name_param text,
  row_limit        integer default 10
)
returns table(
  raw_data jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_table text;
begin
  -- Sécurité : autoriser uniquement les tables G1[ABCD]_* (insensible à la casse)
  if table_name_param !~* '^G1[ABCD]_[a-zA-Z0-9_]+$' then
    raise exception 'Table non autorisée : %', table_name_param;
  end if;

  -- Retrouver le nom exact de la table (la casse peut différer)
  select t.table_name into safe_table
  from information_schema.tables t
  where t.table_schema = 'public'
    and lower(t.table_name) = lower(table_name_param)
  limit 1;

  if safe_table is not null then
    return query execute format(
      'select to_jsonb(row.*) as raw_data from %I row order by ctid desc limit %s',
      safe_table, row_limit
    );
  end if;
end;
$$;

grant execute on function get_group_table_generic(text, integer) to authenticated;
