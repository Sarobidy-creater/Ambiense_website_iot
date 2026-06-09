-- =========================================================
--  Données fictives — projet bar Coupe du Monde
--  À exécuter APRÈS schema.sql
--  Insère les 2 appareils G1E + appareils fictifs G2E-G5E
--  + ~50 mesures réparties sur les dernières heures
-- =========================================================

-- ---- Appareils ----
insert into devices (id, team_code, kind, type, unit, label) values
  -- Équipe G1E (notre équipe)
  ('G1E_temperature', 'G1E', 'sensor',   'temperature', '°C',  'Capteur de température — Bar G1E'),
  ('G1E_ventilateur', 'G1E', 'actuator', 'motor',       '%',   'Ventilateur — Bar G1E'),

  -- Équipe G2E
  ('G2E_son',         'G2E', 'sensor',   'sound',       'dB',  'Capteur de son — G2E'),
  ('G2E_lumiere',     'G2E', 'actuator', 'light',       '%',   'Ruban LED — G2E'),

  -- Équipe G3E
  ('G3E_luminosite',  'G3E', 'sensor',   'light',       'lux', 'Capteur de luminosité — G3E'),
  ('G3E_presence',    'G3E', 'sensor',   'presence',    '',    'Détecteur de présence — G3E'),

  -- Équipe G4E
  ('G4E_humidite',    'G4E', 'sensor',   'humidity',    '%',   'Capteur d''humidité — G4E'),
  ('G4E_ventilo',     'G4E', 'actuator', 'motor',       '%',   'Ventilateur — G4E'),

  -- Équipe G5E
  ('G5E_co2',         'G5E', 'sensor',   'co2',         'ppm', 'Capteur CO₂ — G5E'),
  ('G5E_lumiere',     'G5E', 'actuator', 'light',       '%',   'Spots LED — G5E')
on conflict (id) do nothing;


-- ---- Mesures fictives (~50 lignes, dernières 2 heures) ----
-- Température G1E — montée progressive pendant un match (°C)
insert into measurements (device_id, team_code, type, value, unit, created_at) values
  ('G1E_temperature','G1E','temperature', 22.1,'°C', now() - interval '120 min'),
  ('G1E_temperature','G1E','temperature', 22.4,'°C', now() - interval '110 min'),
  ('G1E_temperature','G1E','temperature', 22.8,'°C', now() - interval '100 min'),
  ('G1E_temperature','G1E','temperature', 23.3,'°C', now() - interval '90 min'),
  ('G1E_temperature','G1E','temperature', 23.9,'°C', now() - interval '80 min'),
  ('G1E_temperature','G1E','temperature', 24.5,'°C', now() - interval '70 min'),
  ('G1E_temperature','G1E','temperature', 25.2,'°C', now() - interval '60 min'),
  ('G1E_temperature','G1E','temperature', 26.0,'°C', now() - interval '50 min'),
  ('G1E_temperature','G1E','temperature', 27.1,'°C', now() - interval '40 min'),
  ('G1E_temperature','G1E','temperature', 28.3,'°C', now() - interval '30 min'),
  ('G1E_temperature','G1E','temperature', 29.0,'°C', now() - interval '20 min'),
  ('G1E_temperature','G1E','temperature', 29.5,'°C', now() - interval '10 min'),
  ('G1E_temperature','G1E','temperature', 30.1,'°C', now() - interval '2 min'),

  -- Son G2E — ambiance match (dB)
  ('G2E_son','G2E','sound', 62,'dB', now() - interval '115 min'),
  ('G2E_son','G2E','sound', 65,'dB', now() - interval '95 min'),
  ('G2E_son','G2E','sound', 71,'dB', now() - interval '75 min'),
  ('G2E_son','G2E','sound', 84,'dB', now() - interval '55 min'),  -- but !
  ('G2E_son','G2E','sound', 91,'dB', now() - interval '45 min'),  -- célébration
  ('G2E_son','G2E','sound', 78,'dB', now() - interval '35 min'),
  ('G2E_son','G2E','sound', 72,'dB', now() - interval '15 min'),
  ('G2E_son','G2E','sound', 68,'dB', now() - interval '3 min'),

  -- Luminosité G3E (lux)
  ('G3E_luminosite','G3E','light', 320,'lux', now() - interval '118 min'),
  ('G3E_luminosite','G3E','light', 315,'lux', now() - interval '98 min'),
  ('G3E_luminosite','G3E','light', 310,'lux', now() - interval '78 min'),
  ('G3E_luminosite','G3E','light', 305,'lux', now() - interval '58 min'),
  ('G3E_luminosite','G3E','light', 300,'lux', now() - interval '38 min'),
  ('G3E_luminosite','G3E','light', 298,'lux', now() - interval '18 min'),
  ('G3E_luminosite','G3E','light', 295,'lux', now() - interval '4 min'),

  -- Présence G3E (0=vide, 1=occupé)
  ('G3E_presence','G3E','presence', 0,'', now() - interval '119 min'),
  ('G3E_presence','G3E','presence', 1,'', now() - interval '85 min'),
  ('G3E_presence','G3E','presence', 1,'', now() - interval '45 min'),
  ('G3E_presence','G3E','presence', 1,'', now() - interval '5 min'),

  -- Humidité G4E (%)
  ('G4E_humidite','G4E','humidity', 48,'%', now() - interval '116 min'),
  ('G4E_humidite','G4E','humidity', 51,'%', now() - interval '96 min'),
  ('G4E_humidite','G4E','humidity', 55,'%', now() - interval '76 min'),
  ('G4E_humidite','G4E','humidity', 59,'%', now() - interval '56 min'),
  ('G4E_humidite','G4E','humidity', 63,'%', now() - interval '36 min'),
  ('G4E_humidite','G4E','humidity', 67,'%', now() - interval '16 min'),
  ('G4E_humidite','G4E','humidity', 70,'%', now() - interval '1 min'),

  -- CO₂ G5E (ppm)
  ('G5E_co2','G5E','co2', 420,'ppm', now() - interval '117 min'),
  ('G5E_co2','G5E','co2', 435,'ppm', now() - interval '97 min'),
  ('G5E_co2','G5E','co2', 460,'ppm', now() - interval '77 min'),
  ('G5E_co2','G5E','co2', 510,'ppm', now() - interval '57 min'),
  ('G5E_co2','G5E','co2', 580,'ppm', now() - interval '37 min'),
  ('G5E_co2','G5E','co2', 620,'ppm', now() - interval '17 min'),
  ('G5E_co2','G5E','co2', 645,'ppm', now() - interval '2 min');
