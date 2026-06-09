# AMBIENSE — Plateforme IoT Bar G1E

> Intelligence environnementale en temps réel pour les bars et salles d'événements.  
> Projet pédagogique ISEP · Groupe G1E · Coupe du Monde IoT

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
| Carte embarquée | Tiva TM4C123 (UART 115 200 baud) |

---

## Prérequis

| Outil | Version min | Vérification |
|---|---|---|
| **Node.js** | 20 LTS | `node -v` |
| **npm** | 10 | `npm -v` |
| **Python** | 3.11 | `python3 --version` |
| **Git** | 2.x | `git --version` |

### Installer Node.js

- **Windows / macOS** : [nodejs.org/en/download](https://nodejs.org/en/download) — télécharger l'installeur LTS
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
- **macOS** :
  ```bash
  brew install python@3.11
  ```
- **Linux** :
  ```bash
  sudo apt-get install python3.11 python3.11-venv python3-pip
  ```

---

## 1 · Cloner le dépôt

```bash
git clone https://github.com/Sarobidy-creater/commun_g1.git
cd commun_g1
```

---

## 2 · Frontend (`front/`)

### 2.1 Variables d'environnement

Créer le fichier `front/.env.local` :

```env
VITE_SUPABASE_URL=https://<votre-projet>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<votre-cle>
VITE_USE_REALTIME=false
VITE_TEAM_CODE=G1E
```

> Les valeurs réelles sont fournies par le référent du groupe G1E.  
> Ne jamais committer `.env.local` (déjà dans `.gitignore`).

### 2.2 Installation et démarrage

```bash
cd front
npm install
npm run dev
```

L'application est disponible sur **http://localhost:5173**

### 2.3 Commandes utiles

```bash
npm run build    # Build de production → dist/
npm run preview  # Prévisualise le build de production
npm run lint     # Linting TypeScript / ESLint
```

---

## 3 · Passerelle (`gateway/`)

La passerelle lit les données UART de la carte Tiva et les envoie à Supabase.  
Elle surveille aussi la table `G1E_commands` pour piloter le ventilateur.

### 3.1 Variables d'environnement

Créer le fichier `gateway/.env` :

```env
SUPABASE_URL=https://<votre-projet>.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # Clé service_role (jamais la clé anon)
SERIAL_PORT=COM3              # Windows : COM3, COM4, ...
                              # macOS   : /dev/tty.usbmodem1101
                              # Linux   : /dev/ttyACM0
```

> La `SUPABASE_SERVICE_KEY` donne accès complet à la BDD.  
> Ne jamais la committer ni l'exposer côté frontend.

### 3.2 Trouver le port série

- **Windows** : Gestionnaire de périphériques → Ports (COM et LPT)
- **macOS** : `ls /dev/tty.*`
- **Linux** : `ls /dev/ttyACM* /dev/ttyUSB*`

### 3.3 Environnement virtuel et dépendances

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
# Venv déjà activé (voir 3.3)
python gateway.py
```

---

## 4 · Base de données Supabase

### 4.1 Créer les tables

Dans l'éditeur SQL Supabase (**SQL Editor → New query**), coller et exécuter :

```
front/supabase_schema.sql
```

Ce script crée les tables `G1E_devices`, `G1E_measurements`, `G1E_commands`,  
active le RLS et insère les appareils de démarrage.

### 4.2 Template email de confirmation

Dans Supabase : **Authentication → Email Templates → Confirm signup**  
Coller le contenu du fichier `front/email_template.html`.

---

## 5 · Workflow Git

### Cloner et travailler

```bash
git clone https://github.com/Sarobidy-creater/commun_g1.git
cd commun_g1
git checkout -b feat/ma-fonctionnalite
# ... modifications ...
git add -A
git commit -m "feat: description courte"
git push origin feat/ma-fonctionnalite
```

### Récupérer les dernières modifications

```bash
git pull origin master
```

### Pousser directement sur main/master

```bash
git add -A
git commit -m "fix: description"
git push
```

---

## 6 · Structure du frontend

```
front/src/
├── auth/           # Contexte Supabase Auth (signIn, signUp, updatePassword)
├── components/
│   ├── svg/        # FanSvg.tsx, SensorIcon.tsx (icônes géométriques)
│   ├── DeviceCard  # Carte appareil + dernière mesure
│   ├── FanControl  # Contrôle ventilateur avec animation SVG
│   ├── Footer      # Footer avec mentions légales ISEP
│   ├── Layout      # Navbar + mega menu + Footer
│   └── TemperatureChart  # Graphique Recharts
├── hooks/
│   ├── useCommand.ts       # Envoi commande + polling statut
│   ├── useDevices.ts       # Liste appareils G1E_devices
│   ├── useMeasurements.ts  # Mesures G1E_measurements (polling/realtime)
│   └── useWeather.ts       # Météo Open-Meteo (Paris)
├── lib/
│   ├── supabase.ts  # Client Supabase + constantes
│   └── types.ts     # Interfaces TypeScript
├── pages/
│   ├── HomePage      # Landing page éditoriale
│   ├── DashboardPage # Station G1E : stats + chart + ventilateur
│   ├── NetworkPage   # Réseau : G1E live + G1A-G1D en attente
│   ├── AdvancedPage  # Contrôle actionneurs externes
│   ├── ProfilePage   # Gestion compte / mot de passe
│   ├── LoginPage     # Connexion split-screen
│   └── SignupPage    # Inscription split-screen
└── theme/
    ├── tokens.css   # Variables CSS (couleurs, typo, espacements)
    └── global.css   # Imports Google Fonts + reset
```

---

## 7 · Pages et routes

| Route | Page | Accès |
|---|---|---|
| `/` | HomePage | Public |
| `/login` | LoginPage | Public |
| `/signup` | SignupPage | Public |
| `/dashboard` | DashboardPage | Connecté |
| `/network` | NetworkPage | Connecté |
| `/advanced` | AdvancedPage | Connecté |
| `/profile` | ProfilePage | Connecté |

---

## 8 · Réseau IoT — nomenclature des groupes

| Groupe | Tables | Capteurs |
|---|---|---|
| **G1E** (nous) | `G1E_devices`, `G1E_measurements`, `G1E_commands` | Température · Ventilateur |
| G1A | `G1A_devices`, `G1A_measurements` | Son ambiant (dB) |
| G1B | `G1B_devices`, `G1B_measurements` | Présence (pers.) |
| G1C | `G1C_devices`, `G1C_measurements` | Fumée (ppm) |
| G1D | `G1D_devices`, `G1D_measurements`, `G1D_commands` | Alcool (ppm) · Buzzer |

Chaque groupe crée ses propres tables selon la même nomenclature `GXX_*`.  
L'intégration dans `NetworkPage` se fait en ajoutant un hook par groupe.

---

## 9 · Dépannage

| Problème | Solution |
|---|---|
| `VITE_SUPABASE_URL` manquante | Vérifier `front/.env.local` |
| Port série introuvable | Voir section 3.2 — vérifier le driver FTDI/CP210x |
| `Permission denied` sur le port (Linux) | `sudo usermod -aG dialout $USER` puis se reconnecter |
| Erreur RLS Supabase | Vérifier que le schéma SQL a bien été exécuté |
| `npm install` échoue | Vérifier la version Node (`node -v` ≥ 20) |
| Build TypeScript échoue | `npm run lint` pour voir les erreurs détaillées |

---

## Contacts

Projet pédagogique · **ISEP** — Institut Supérieur d'Électronique de Paris  
10 Rue de Vanves · 92130 Issy-les-Moulineaux · [isep.fr](https://www.isep.fr)  
Groupe **G1E** · Coupe du Monde IoT · Promo 2024
