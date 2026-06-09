// =========================================================
//  Footer — AMBIENSE · une seule bande compacte
// =========================================================
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer} aria-label="Pied de page">
      <div className={styles.inner}>

        {/* Gauche : marque + tagline + legal */}
        <div className={styles.left}>
          <div className={styles.brand}>
            <Link to="/" className={styles.wordmark} aria-label="AMBIENSE">
              AMBIENSE
            </Link>
            <p className={styles.tagline}>Intelligence environnementale en temps r&eacute;el</p>
          </div>
          <span className={styles.sep} aria-hidden="true" />
          <span className={styles.legal}>
            &copy; {new Date().getFullYear()} ISEP &mdash; Groupe G1E
            &nbsp;&middot;&nbsp;
            <a href="mailto:info@isep.fr" className={styles.legalLink}>info@isep.fr</a>
          </span>
        </div>

        {/* Droite : liens essentiels */}
        <nav className={styles.right} aria-label="Navigation pied de page">
          <Link to="/dashboard" className={styles.link}>Surveillance</Link>
          <Link to="/network"   className={styles.link}>Capteurs</Link>
          <Link to="/advanced"  className={styles.link}>Controle</Link>
          <a
            href="https://www.isep.fr"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            isep.fr ↗
          </a>
        </nav>

      </div>
    </footer>
  );
}