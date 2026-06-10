# AMBIENSE — Plateforme IoT Bar G1E

> Intelligence environnementale en temps réel pour les bars et salles d'événements.
> Projet pédagogique ISEP · Groupe G1E · Coupe du Monde IoT

---

## ⚡ Démarrage rapide (toutes plateformes)

```bash
git clone https://github.com/Sarobidy-creater/Ambiense_website_iot.git
cd Ambiense_website_iot/front
npm install && npm run dev
```

**C'est tout.** Ouvrez http://localhost:5173 — le site démarre avec les credentials Supabase G1E déjà inclus dans `.env` (clé publishable publique, sécurisée par RLS).

> **Mac / Linux** : si `npm` n'est pas installé → [nodejs.org](https://nodejs.org) ou `brew install node`  
> **Windows** : si `npm` n'est pas reconnu → installer Node.js LTS depuis [nodejs.org](https://nodejs.org) et redémarrer le terminal

---

## Architecture

```
commun_g1/
├── front/        # Application web React + TypeScript + Vite
└── gateway/      # Passerelle Python : Tiva TM4C123 ↔ Supabase
```

**Stack**

| Couche | Technologie |
|---|---|
| Frontend | React 19 · TypeScript · Vite · CSS Modules |
| Backend / BDD | Supabase (PostgreSQL + Auth + Realtime) |
| Graphiques | Recharts |
| Router | React Router v6 |
| Passerelle | Python 3.11 · pyserial |
| Carte embarquee | Tiva TM4C123 (UART 115 200 baud) |

---

## Prerequis

| Outil | Version min | Verification |
|---|---|---|
| **Node.js** | 20 LTS | `node -v` |
| **npm** | 10 | `npm -v` |
| **Python** | 3.11 | `python3 --version` |
| **Git** | 2.x | `git --version` |

### Installer Node.js

- **Windows / macOS** : [nodejs.org/en/download](https://nodejs.org/en/download) — telecharger l'installeur LTS
- **Linux (Debian/Ubuntu)** :
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- **macOS (Homebrew)** :
  ```bash
  brew install node
  ```

### Installer Python 3.11+

- **Windows** : [python.org/downloads](https://www.python.org/downloads/) — cocher *Add Python to PATH*
- **macOS** : `brew install python@3.11`
- **Linux** : `sudo apt-get install python3.11 python3.11-venv python3-pip`

---

## 1 · Cloner le depot

```bash
git clone https://github.com/Sarobidy-creater/commun_g1.git
cd commun_g1
```

---

## 2 · Frontend (`front/`)

### 2.1 Variables d'environnement

Creer le fichier `front/.env.local` :

```env
VITE_SUPABASE_URL=https://<votre-projet>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<votre-cle>
VITE_USE_REALTIME=false
VITE_TEAM_CODE=G1E
VITE_RAPIDAPI_KEY=<votre-cle-rapidapi>   # optionnel — widget matchs football
```

> Les valeurs reelles sont fournies par le referent du groupe G1E.
> Ne jamais committer `.env.local` (deja dans `.gitignore`).

### 2.2 Installation et demarrage

```bash
cd front
npm install
npm run dev
```

L'application est disponible sur **http://localhost:5173**

### 2.3 Commandes utiles

```bash
npm run build    # Build de production → dist/
npm run preview  # Previsualise le build de production
npm run lint     # Linting TypeScript / ESLint
```

---

## 3 · Passerelle (`gateway/`)

La passerelle lit les donnees UART de la carte Tiva et les envoie a Supabase.
Elle surveille aussi la table `G1E_commands` pour piloter le ventilateur.

### 3.1 Variables d'environnement

Creer le fichier `gateway/.env` :

```env
SUPABASE_URL=https://<votre-projet>.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # Cle service_role (jamais la cle anon)
SERIAL_PORT=COM3              # Windows : COM3, COM4, ...
                              # macOS   : /dev/tty.usbmodem1101
                              # Linux   : /dev/ttyACM0
```

### 3.2 Trouver le port serie

- **Windows** : Gestionnaire de peripheriques → Ports (COM et LPT)
- **macOS** : `ls /dev/tty.*`
- **Linux** : `ls /dev/ttyACM* /dev/ttyUSB*`

### 3.3 Environnement virtuel et dependances

#### Windows (PowerShell)

```powershell
cd gateway
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
pip install -r requirement.txt
```

#### macOS / Linux

```bash
cd gateway
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirement.txt
```

### 3.4 Lancer la passerelle

```bash
# Venv deja active (voir 3.3)
python gateway.py
```

---

## 4 · Base de donnees Supabase

### 4.1 Creer les tables

Dans l'editeur SQL Supabase (**SQL Editor → New query**), coller et executer :

```
front/supabase_schema.sql
```

Ce script cree les tables `user_roles`, `G1E_devices`, `G1E_measurements`, `G1E_commands`,
active le RLS avec des policies idempotentes (DROP + CREATE) et insere les appareils de demarrage.

### 4.2 Creer un compte admin

1. Creer un compte depuis le site → `/signup` avec l'email choisi
2. Dans Supabase SQL Editor, executer :

```sql
insert into "user_roles" (user_id, role)
select id, 'admin'
from auth.users
where email = 'votre@email.com'   -- remplacer
on conflict (user_id) do update set role = 'admin';
```

L'acces `/admin` est protege par verification du role en BDD.

### 4.3 Template email de confirmation

Dans Supabase : **Authentication → Email Templates → Confirm signup**
Coller le contenu du fichier `front/email_template.html`.

---

## 5 · Workflow Git

```bash
# Cloner et travailler
git clone https://github.com/Sarobidy-creater/commun_g1.git
cd commun_g1
git checkout -b feat/ma-fonctionnalite

# Commit et push
git add -A
git commit -m "feat: description courte"
git push origin feat/ma-fonctionnalite

# Recuperer les dernieres modifications
git pull
```

---

## 6 · Structure du frontend

```
front/src/
├── auth/           # Contexte Supabase Auth (signIn, signUp, updatePassword)
├── components/
│   ├── svg/        # FanSvg.tsx, SensorIcon.tsx (icones geometriques)
│   ├── AdminLayout  # Layout sidebar pour l'espace admin
│   ├── AdminRoute   # Protection des routes admin (role BDD)
│   ├── DeviceCard   # Carte appareil + derniere mesure
│   ├── FanControl   # Controle ventilateur avec animation SVG
│   ├── Footer       # Footer 3 colonnes
│   ├── Layout       # Navbar + mega menu + Footer
│   └── SensorChart  # Graphique generique par capteur
├── hooks/
│   ├── useAdmin.ts         # CRUD devices, mesures, commandes, agregats, horaire
│   ├── useCommand.ts       # Envoi commande + polling statut
│   ├── useDevices.ts       # Liste appareils G1E_devices
│   ├── useFootballLive.ts  # Matchs football en direct (RapidAPI)
│   ├── useIsAdmin.ts       # Verification role admin
│   ├── useMeasurements.ts  # Mesures G1E_measurements (polling/realtime)
│   └── useWeather.ts       # Meteo Open-Meteo (Paris)
├── lib/
│   ├── groups.ts    # Source unique : tous les groupes et capteurs du reseau
│   ├── supabase.ts  # Client Supabase + constantes
│   └── types.ts     # Interfaces TypeScript
├── pages/
│   ├── admin/
│   │   ├── AdminOverviewPage     # KPIs + sparklines + controle rapide
│   │   ├── AdminAnalyticsPage    # Agregats horaires + detection anomalies
│   │   ├── AdminDevicesPage      # CRUD complet appareils
│   │   ├── AdminMeasurementsPage # Explorateur + export CSV + multi-select
│   │   ├── AdminCommandsPage     # Historique + bulk cancel
│   │   └── AdminSchemaPage       # SQL + instructions
│   ├── HomePage          # Landing page editoriale avec video et widget football
│   ├── DashboardPage     # Station G1E : stats + chart temp/hum + ventilateur
│   ├── NetworkPage       # Reseau : G1E live + G1A-G1D en attente
│   ├── SensorDetailPage  # Surveillance detaillee par capteur (/sensor/:deviceId)
│   ├── AdvancedPage      # Controle actionneurs externes
│   ├── ProfilePage       # Gestion compte / mot de passe
│   ├── LoginPage         # Connexion split-screen
│   └── SignupPage        # Inscription split-screen
└── theme/
    ├── tokens.css   # Variables CSS (couleurs, typo, espacements)
    └── global.css   # Imports Google Fonts + reset
```

---

## 7 · Pages et routes

| Route | Page | Acces |
|---|---|---|
| `/` | HomePage | Public |
| `/login` | LoginPage | Public |
| `/signup` | SignupPage | Public |
| `/dashboard` | DashboardPage | Connecte |
| `/network` | NetworkPage | Connecte |
| `/sensor/:deviceId` | SensorDetailPage | Connecte |
| `/advanced` | AdvancedPage | Connecte |
| `/profile` | ProfilePage | Connecte |
| `/admin` | AdminOverviewPage | **Admin uniquement** |
| `/admin/analytics` | AdminAnalyticsPage | **Admin uniquement** |
| `/admin/devices` | AdminDevicesPage | **Admin uniquement** |
| `/admin/measurements` | AdminMeasurementsPage | **Admin uniquement** |
| `/admin/commands` | AdminCommandsPage | **Admin uniquement** |
| `/admin/schema` | AdminSchemaPage | **Admin uniquement** |

---

## 8 · Reseau IoT — nomenclature des groupes

| Groupe | Tables | Capteurs |
|---|---|---|
| **G1E** (nous) | `G1E_devices`, `G1E_measurements`, `G1E_commands` | Temperature · Humidite (DHT15) · Ventilateur (Servo S148) |
| G1A | `G1A_devices`, `G1A_measurements` | Son ambiant (dB) |
| G1B | `G1B_devices`, `G1B_measurements` | Presence (pers.) |
| G1C | `G1C_devices`, `G1C_measurements` | Fumee (ppm) |
| G1D | `G1D_devices`, `G1D_measurements`, `G1D_commands` | Alcool (ppm) · Buzzer |

---

## 9 · Depannage

| Probleme | Solution |
|---|---|
| `G1E_devices` introuvable (erreur RLS) | Executer `front/supabase_schema.sql` dans Supabase SQL Editor |
| Policy deja existante (erreur 42710) | Le schema utilise `DROP POLICY IF EXISTS` — re-executer le fichier complet |
| Port serie introuvable | Voir section 3.2 — verifier le driver FTDI/CP210x |
| `Permission denied` sur le port (Linux) | `sudo usermod -aG dialout $USER` puis se reconnecter |
| `/admin` redirige vers `/` | Executer le SQL de la section 4.2 pour attribuer le role admin |
| `VITE_SUPABASE_URL` manquante | Verifier `front/.env.local` |
| Port 5173 deja utilise | `Get-Process node | Stop-Process -Force` puis relancer `npm run dev` |
| `npm install` echoue | Verifier la version Node (`node -v` >= 20) |

---

## Contacts

Projet pedagogique · **ISEP** — Institut Superieur d'Electronique de Paris
10 Rue de Vanves · 92130 Issy-les-Moulineaux · [isep.fr](https://www.isep.fr)
Groupe **G1E** · Coupe du Monde IoT · Promo 2024