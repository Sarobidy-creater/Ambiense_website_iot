// =========================================================
//  Footer — AMBIENSE · une seule bande compacte
// =========================================================
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer} aria-label="Pied de page">
      <div className={styles.inner}>

        {/* Gauche : marque + ISEP */}
        <div className={styles.left}>
          <Link to="/" className={styles.wordmark} aria-label="AMBIENSE">
            AMBIENSE
          </Link>
          <span className={styles.sep} aria-hidden="true" />
          <span className={styles.legal}>
            &copy; {new Date().getFullYear()} ISEP &mdash; Projet G1E
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