// =========================================================
//  Footer — AMBIENSE · 3 colonnes essentielles
// =========================================================
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer} aria-label="Pied de page">
      <div className={styles.inner}>

        {/* Col 1 — Marque */}
        <div className={styles.colBrand}>
          <Link to="/" className={styles.wordmark} aria-label="AMBIENSE">
            AMBIENSE
          </Link>
          <p className={styles.tagline}>
            Intelligence environnementale<br />
            en temps r&eacute;el pour les bars.
          </p>
          <p className={styles.legal}>
            &copy; {new Date().getFullYear()} &mdash; Projet p&eacute;dagogique ISEP<br />
            Groupe G1E &middot; Coupe du Monde IoT
          </p>
        </div>

        {/* Col 2 — Navigation */}
        <div className={styles.col}>
          <h3 className={styles.colTitle}>Plateforme</h3>
          <ul className={styles.colLinks}>
            <li><Link to="/dashboard" className={styles.link}>Surveillance</Link></li>
            <li><Link to="/network"   className={styles.link}>Réseau de capteurs</Link></li>
            <li><Link to="/advanced"  className={styles.link}>Centre de contr&ocirc;le</Link></li>
            <li><Link to="/profile"   className={styles.link}>Mon profil</Link></li>
          </ul>
        </div>

        {/* Col 3 — ISEP */}
        <div className={styles.col}>
          <h3 className={styles.colTitle}>ISEP</h3>
          <ul className={styles.colLinks}>
            <li>
              <a href="https://www.isep.fr" target="_blank" rel="noopener noreferrer" className={styles.link}>
                isep.fr &#x2197;
              </a>
            </li>
            <li>
              <a href="mailto:info@isep.fr" className={styles.link}>info@isep.fr</a>
            </li>
            <li>
              <span className={styles.meta}>10 Rue de Vanves<br />92130 Issy-les-Moulineaux</span>
            </li>
          </ul>
        </div>

      </div>
    </footer>
  );
}