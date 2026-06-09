import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import heroImg from '../../images/Homepage_illustration.jpg';
import styles from './HomePage.module.css';

const STATS = [
  { value: '5',   label: 'Groupes actifs'       },
  { value: '1 s', label: 'Rafraichissement'      },
  { value: 'RT',  label: 'Temps reel'            },
  { value: '24/7',label: 'Surveillance continue' },
];

const FEATURES = [
  {
    num: '01',
    title: 'Surveillance en direct',
    body:  "Temperature, decibels, presence, qualite d'air. Chaque capteur remonte ses donnees en moins d'une seconde.",
  },
  {
    num: '02',
    title: 'Controle a distance',
    body:  "Ventilation, ambiance sonore, signalerique. Envoyez une commande depuis n'importe quel ecran, le retour d'etat est immediat.",
  },
  {
    num: '03',
    title: 'Alertes intelligentes',
    body:  'Seuils configurables par capteur. Des qu\'une limite est franchie, l\'alerte s\'affiche instantanement.',
  },
];

const ARCH = ['Capteur', 'Tiva TM4C123', 'Passerelle', 'Supabase', 'AMBIENSE'];

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className={styles.page}>

      {/* ══ Hero pleine page ══════════════════════════════════ */}
      <section className={styles.hero} aria-labelledby="hero-title">

        {/* Photo de fond */}
        <div
          className={styles.heroMedia}
          style={{ backgroundImage: `url(${heroImg})` }}
          aria-hidden="true"
          role="img"
          aria-label="Ambiance d'un bar lors d'un match"
        />

        {/* Overlays (gradient bas + gauche) */}
        <div className={styles.heroOverlay} aria-hidden="true" />

        {/* Espace pour la navbar transparente */}
        <div className={styles.navSpacer} aria-hidden="true" />

        {/* Contenu editorial */}
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
            Cinq capteurs, deux actionneurs — tout ce qu&rsquo;il faut<br />
            pour une soiree parfaite.
          </p>
          <div className={styles.heroCta}>
            {user ? (
              <Link to="/dashboard" className={styles.ctaPrimary}>
                Acceder a la plateforme &rarr;
              </Link>
            ) : (
              <>
                <Link to="/login"  className={styles.ctaPrimary}>Se connecter &rarr;</Link>
                <Link to="/signup" className={styles.ctaSecondary}>Creer un compte</Link>
              </>
            )}
          </div>
        </div>

        {/* Indicateur de scroll */}
        <div className={styles.scrollHint} aria-hidden="true">
          <span className={styles.scrollLine} />
          <span className={styles.scrollWord}>Decouvrir</span>
        </div>

      </section>

      {/* ══ Bande stats ══════════════════════════════════════ */}
      <section className={styles.statsBar} aria-label="Chiffres cles">
        {STATS.map(s => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statVal}>{s.value}</span>
            <span className={styles.statLbl}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* ══ Fonctionnalites ══════════════════════════════════ */}
      <section className={styles.features} aria-labelledby="feat-title">
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

      {/* ══ Architecture ════════════════════════════════════ */}
      <section className={styles.arch} aria-labelledby="arch-title">
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

      {/* ══ Footer ══════════════════════════════════════════ */}
      <footer className={styles.footer}>
        <span className={styles.footerBrand}>AMBIENSE</span>
        <span className={styles.footerDot} aria-hidden="true">·</span>
        <span className={styles.footerMeta}>
          Intelligence environnementale &middot; {new Date().getFullYear()}
        </span>
      </footer>

    </div>
  );
}