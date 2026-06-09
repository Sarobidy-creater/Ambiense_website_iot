# Bar Coupe du Monde — Dashboard IoT · Équipe G1E · Madagascar

Tableau de bord web IoT pour la gestion d'un bar diffusant la **Coupe du Monde**.
Projet commun ISEP — 5 équipes, 1 base Supabase partagée.

---

## Cas d'usage

Pendant les matchs, le bar se remplit et la température monte. L'équipe **G1E** surveille le capteur de température (`G1E_temperature`) et pilote le ventilateur (`G1E_ventilateur`) via ce tableau de bord. Le site lit aussi les données des 4 autres équipes (son, lumière, présence, CO₂).

```
Capteur temp → Tiva TM4C123 → Passerelle → Supabase ← ce site (lecture toutes équipes)
Ce site → commande dans Supabase → Passerelle → Tiva → ventilateur
```

## Équipes & appareils

| Équipe | Capteur           | Actionneur        |
|--------|-------------------|-------------------|
| G1E    | Température (°C)  | Ventilateur       |
| G1A    | Décibel (dB)      | —                 |
| G1B    | Nb de personnes   | —                 |
| G1C    | Fumée             | —                 |
| G1D    | Éthylotest (mg/L) | Buzzer            |

---

## Installation & lancement

```bash
# 1. Cloner le dépôt et aller dans le dossier front
cd front

# 2. Copier les variables d'environnement
cp .env.local.example .env.local
# Puis éditer .env.local avec votre URL Supabase et clé publishable

# 3. Installer les dépendances
npm install

# 4. Lancer le serveur de développement
npm run dev

# 5. Build de production
npm run build
```

## Variables d'environnement (`.env.local`)

| Variable                          | Description                                        |
|-----------------------------------|----------------------------------------------------|
| `VITE_SUPABASE_URL`               | URL de votre projet Supabase                       |
| `VITE_SUPABASE_PUBLISHABLE_KEY`   | Clé publishable (jamais la clé service_role !)     |
| `VITE_USE_REALTIME`               | `true` = Supabase Realtime, `false` = polling 1 s  |
| `VITE_TEAM_CODE`                  | Préfixe d'équipe (`G1E`)                           |

**Ne jamais commiter `.env.local`** — le fichier est dans `.gitignore`.

## Bascule Realtime / Polling

- **Polling (défaut, `VITE_USE_REALTIME=false`)** : requête Supabase toutes les 1 s,
  curseur `lastTs` pour ne retélécharger que les nouvelles lignes, pause quand
  l'onglet est caché (`visibilitychange`).
- **Realtime (`VITE_USE_REALTIME=true`)** : `supabase.channel().on('postgres_changes'…)`.
  Activer dans Supabase → Database → Replication → Publications → supabase_realtime.

Le hook `useMeasurements` masque ce choix au reste de l'app.

---

## SQL à coller dans Supabase (éditeur SQL)

Le fichier `supabase_schema.sql` contient :
1. **Schéma** — tables `devices`, `measurements`, `commands`
2. **RLS** — politiques de sécurité (lecture authentifiée, écriture service/passerelle)
3. **Données fictives** — appareils G1E–G5E et ~50 mesures pour démo sans matériel

```bash
# Coller le contenu de supabase_schema.sql dans :
# Supabase > SQL Editor > New query > Run
```

---

## Pages de l'application

| Route        | Accès      | Description                                          |
|--------------|------------|------------------------------------------------------|
| `/`          | Public     | Accueil — présentation cas d'usage + équipe G1E      |
| `/login`     | Public     | Connexion email + mot de passe                       |
| `/signup`    | Public     | Inscription                                          |
| `/dashboard` | Connecté   | Données temps réel + contrôle ventilateur + graphes  |
| `/devices`   | Connecté   | Déclarer / visualiser les appareils                  |
| `/advanced`  | Connecté   | Piloter les actionneurs des autres équipes (bonus)   |

---

## Éco-conception

- **SVG légers** : toutes les illustrations (baobabs, ravinala, ballon) sont des SVG
  inline codés à la main — aucune image externe, poids négligeable.
- **2 polices maximum** : Fraunces (display) + Inter (données), chargées en `display=swap`.
- **Requêtes bornées** : `.limit()` systématique sur chaque requête Supabase ;
  curseur `lastTs` en polling pour ne récupérer que les deltas.
- **Pause onglet caché** : `document.visibilityState === 'hidden'` coupe le polling
  dès que l'utilisateur change d'onglet.
- **Lazy-loading** : toutes les pages chargées en code-splitting (`React.lazy`).
- **Météo** : rafraîchissement toutes les 10 min (données non temps réel).
- **Pas de dépendances inutiles** : uniquement `@supabase/supabase-js`, `recharts`,
  `react-router-dom` au-delà de React.

---

## Accessibilité (WCAG AA)

- Contrastes vérifiés (mode sombre nuit savane / ambre ≥ 4.5:1).
- Labels HTML sur tous les contrôles : slider ventilateur, filtres, formulaires auth.
- Navigation clavier complète, `focus-visible` visible sur tous les éléments.
- ARIA : `role="alert"` sur les erreurs, `aria-live="polite"` sur les mises à jour,
  `aria-label` sur icônes décoratives, `role="status"` sur les états de chargement.
- Structure sémantique : `<main>`, `<nav>`, `<header>`, `<section>`, `<article>`,
  `<footer>`, titres hiérarchisés `h1 > h2 > h3`.
- Classe `.sr-only` pour les textes de labels cachés visuellement.

---

## Architecture des fichiers

```
src/
├── lib/
│   ├── supabase.ts     # Client Supabase + constantes
│   └── types.ts        # Types TS partagés (Device, Measurement, Command…)
├── auth/
│   └── AuthContext.tsx # Contexte Auth Supabase
├── hooks/
│   ├── useMeasurements.ts  # Polling + Realtime
│   ├── useCommand.ts       # Envoi commande + suivi statut
│   ├── useDevices.ts       # Liste appareils
│   └── useWeather.ts       # API Open-Meteo (météo extérieure)
├── components/
│   ├── Layout.tsx          # Shell sidebar + contenu
│   ├── DeviceCard.tsx      # Carte appareil
│   ├── FanControl.tsx      # Panneau ventilateur G1E
│   ├── TemperatureChart.tsx# Graphique Recharts
│   ├── ProtectedRoute.tsx  # Guard route
│   └── svg/                # Baobab, Ravinala, SoccerBall, EmptyBaobab
├── pages/
│   ├── HomePage.tsx        # Accueil public
│   ├── LoginPage.tsx       # Connexion
│   ├── SignupPage.tsx      # Inscription
│   ├── DashboardPage.tsx   # Dashboard principal
│   ├── DevicesPage.tsx     # Gestion appareils
│   └── AdvancedPage.tsx    # Module avancé inter-équipes
└── theme/
    ├── tokens.css          # Variables CSS (palette Madagascar)
    └── global.css          # Reset + base + utilitaires
```

---

*Projet ISEP · Équipe G1E · 2024–2025*


The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
