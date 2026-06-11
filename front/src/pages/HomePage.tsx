// =========================================================
//  HomePage — AMBIENSE · design editorial premium
// =========================================================
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import heroImg from '../../images/Homepage_illustration.jpg';
import matchVideo from '../../images/Fans at Ashton Gate Stadium, Bristol, celebrate England winner against Wales at Euro 2016.mp4';
import styles from './HomePage.module.css';

const STATS = [
  { value: '5',    label: 'Groupes actifs'       },
  { value: '1 s',  label: 'Rafraichissement'      },
  { value: 'RT',   label: 'Temps reel'            },
  { value: '24/7', label: 'Surveillance continue' },
];

const FEATURES = [
  {
    num: '01',
    title: 'Surveillance en direct',
    body: "Temperature, decibels, presence, qualite d'air. Chaque capteur remonte ses donnees en moins d'une seconde.",
  },
  {
    num: '02',
    title: 'Controle a distance',
    body: "Ventilation, ambiance sonore. Envoyez une commande depuis n'importe quel ecran — retour d'etat immediat.",
  },
  {
    num: '03',
    title: 'Alertes intelligentes',
    body: "Seuils configurables par capteur. Des qu'une limite est franchie, l'alerte s'affiche instantanement.",
  },
];

const SENSORS = [
  { code: 'TEMP',  label: 'Temperature',  unit: 'degC',  group: 'G1E', kind: 'sensor'   },
  { code: 'FAN',   label: 'Ventilateur',  unit: '%',     group: 'G1E', kind: 'actuator' },
  { code: 'dB',    label: 'Son ambiant',  unit: 'dB',    group: 'G1A', kind: 'sensor'   },
  { code: 'PRES',  label: 'Presence',     unit: 'pers.', group: 'G1B', kind: 'sensor'   },
  { code: 'SMOKE', label: 'Fumee',        unit: 'ppm',   group: 'G1C', kind: 'sensor'   },
  { code: 'ALC',   label: 'Alcool',       unit: 'ppm',   group: 'G1D', kind: 'sensor'   },
];

const ARCH = ['Capteur', 'Tiva TM4C123', 'Passerelle', 'Supabase', 'AMBIENSE'];

// Unsplash bar/nightlife photos
const GALLERY = [
  {
    url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80',
    alt: 'Bar illumine aux neons, cocktails sur le comptoir',
    caption: 'Neon bar',
  },
  {
    url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=80',
    alt: 'Ambiance chaude bar soiree',
    caption: 'Soiree live',
  },
];

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className={styles.page}>

      {/* ============================================================
          Hero pleine page
      ============================================================ */}
      <section className={styles.hero} aria-labelledby="hero-title">

        <div
          className={styles.heroMedia}
          style={{ backgroundImage: "url(" + heroImg + ")" }}
          aria-hidden="true"
        />
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={styles.navSpacer}   aria-hidden="true" />

        <div className={styles.heroBody}>
          <p className={styles.eyebrow}>
            Plateforme IoT &middot; Bar &amp; Sport Live
          </p>
          <h1 id="hero-title" className={styles.heroTitle}>
            L&rsquo;ambiance,<br />
            <em>sous controle.</em>
          </h1>
          <p className={styles.heroSub}>
            Intelligence environnementale en temps reel.<br />
            Cinq capteurs, deux actionneurs &mdash; tout ce qu&rsquo;il faut<br />
            pour une soiree parfaite.
          </p>
          <div className={styles.heroCta}>
            {user ? (
              <Link to="/dashboard" className={styles.ctaPrimary}>
                Accéder a la plateforme &rarr;
              </Link>
            ) : (
              <>
                <Link to="/login"  className={styles.ctaPrimary}>Se connecter &rarr;</Link>
                <Link to="/signup" className={styles.ctaSecondary}>Créer un compte</Link>
              </>
            )}
          </div>
        </div>

        <div className={styles.scrollHint} aria-hidden="true">
          <span className={styles.scrollLine} />
          <span className={styles.scrollWord}>Découvrir</span>
        </div>
      </section>

      {/* ============================================================
          Stats
      ============================================================ */}
      <section className={styles.statsBar} aria-label="Chiffres cles">
        {STATS.map(s => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statVal}>{s.value}</span>
            <span className={styles.statLbl}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* ============================================================
          Galerie images / video
      ============================================================ */}
      <section className={styles.gallery} aria-label="Galerie bar">
        <div className={styles.galleryGrid}>

          {/* Video fans en boucle */}
          <div className={styles.galleryMain}>
            <video
              className={styles.galleryVideo}
              src={matchVideo}
              autoPlay
              loop
              muted
              playsInline
              aria-hidden="true"
            />
          </div>

          {/* Photos bar */}
          {GALLERY.map((img, i) => (
            <div
              key={i}
              className={styles.galleryPhoto}
              style={{ backgroundImage: "url(" + img.url + ")" }}
              role="img"
              aria-label={img.alt}
            >
              <div className={styles.galleryPhotoOverlay} />
              <span className={styles.galleryPhotoCaption}>{img.caption}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          Fonctionnalites
      ============================================================ */}
      <section id="fonctionnalites" className={styles.features} aria-labelledby="feat-title">
        <div className={styles.featHead}>
          <span className={styles.sectionEye}>Fonctionnalites</span>
          <h2 id="feat-title" className={styles.sectionTitle}>
            Une plateforme,<br />trois dimensions.
          </h2>
        </div>
        <div className={styles.featGrid}>
          {FEATURES.map(f => (
            <article key={f.num} className={styles.featCard}>
              <span className={styles.featNum}>{f.num}</span>
              <h3 className={styles.featTitle}>{f.title}</h3>
              <p className={styles.featBody}>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ============================================================
          Architecture
      ============================================================ */}
      <section id="architecture" className={styles.arch} aria-labelledby="arch-title">
        <div className={styles.archInner}>
          <div className={styles.archText}>
            <span className={styles.sectionEye}>Architecture</span>
            <h2 id="arch-title" className={styles.sectionTitle}>
              Du capteur<br />a l&rsquo;ecran.
            </h2>
            <p className={styles.archDesc}>
              Chaque capteur communique via une carte Tiva TM4C123.
              La passerelle serie remonte les mesures vers Supabase.
              Le tableau de bord se met a jour en moins d&rsquo;une seconde.
            </p>
          </div>
          <div className={styles.archFlow} aria-hidden="true">
            {ARCH.map((step, i) => (
              <div key={step} className={styles.archItem}>
                <div className={styles.archStep}>
                  <div className={styles.archDot} />
                  <span className={styles.archLbl}>{step}</span>
                </div>
                {i < ARCH.length - 1 && <div className={styles.archLine} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          Réseau IoT — six capteurs
      ============================================================ */}
      <section id="capteurs" className={styles.sensors} aria-labelledby="sensors-title">
        <div className={styles.sensorsInner}>
          <div className={styles.sensorsHead}>
            <span className={styles.sectionEye}>Réseau IoT</span>
            <h2 id="sensors-title" className={styles.sectionTitle}>
              Six capteurs,<br />un seul ecran.
            </h2>
            <p className={styles.sensorsDesc}>
              Cinq groupes connectes, deux types d&rsquo;appareils :
              capteurs passifs et actionneurs pilotables a distance.
            </p>
          </div>
          <div className={styles.sensorsGrid}>
            {SENSORS.map(s => (
              <div
                key={s.code}
                className={[
                  styles.sensorCard,
                  s.group === 'G1E' ? styles.sensorOwn : '',
                  s.kind === 'actuator' ? styles.sensorAct : '',
                ].filter(Boolean).join(' ')}
              >
                <span className={styles.sensorGroup}>{s.group}</span>
                <span className={styles.sensorLabel}>{s.label}</span>
                <span className={styles.sensorUnit}>{s.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          CTA final
      ============================================================ */}
      <section className={styles.ctaSection} aria-labelledby="cta-title">
        <div
          className={styles.ctaBg}
          style={{ backgroundImage: "url(" + heroImg + ")" }}
          aria-hidden="true"
        />
        <div className={styles.ctaOverlay} aria-hidden="true" />
        <div className={styles.ctaContent}>
          <h2 id="cta-title" className={styles.ctaTitle}>
            Pret a surveiller<br /><em>votre soiree ?</em>
          </h2>
          <p className={styles.ctaSub}>
            Connectez-vous pour accéder au tableau de bord en temps reel.
          </p>
          <div className={styles.heroCta}>
            {user ? (
              <Link to="/dashboard" className={styles.ctaPrimary}>
                Tableau de bord &rarr;
              </Link>
            ) : (
              <>
                <Link to="/login"  className={styles.ctaPrimary}>Se connecter &rarr;</Link>
                <Link to="/signup" className={styles.ctaSecondary}>Créer un compte</Link>
              </>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}