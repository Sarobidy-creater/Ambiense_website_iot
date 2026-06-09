// =========================================================
//  Footer — AMBIENSE · mentions légales ISEP complètes
// =========================================================
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className={styles.footer} aria-label="Pied de page">
      <div className={styles.inner}>

        {/* Col 1 — Marque & ISEP */}
        <div className={styles.colBrand}>
          <Link to="/" className={styles.wordmark} aria-label="AMBIENSE — Accueil">
            AMBIENSE
          </Link>
          <p className={styles.tagline}>
            Intelligence environnementale<br />
            en temps réel pour les bars<br />
            et salles d'événements.
          </p>
          <address className={styles.address}>
            <strong>ISEP</strong><br />
            Institut Supérieur d'Électronique de Paris<br />
            10 Rue de Vanves<br />
            92130 Issy-les-Moulineaux, France<br />
            <a href="tel:+33149545200" className={styles.addrLink}>+33 1 49 54 52 00</a><br />
            <a href="mailto:info@isep.fr" className={styles.addrLink}>info@isep.fr</a><br />
            <a
              href="https://www.isep.fr"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.addrLink}
            >
              isep.fr ↗
            </a>
          </address>
        </div>

        {/* Col 2 — Plateforme */}
        <div className={styles.col}>
          <h3 className={styles.colTitle}>Plateforme</h3>
          <ul className={styles.colLinks}>
            <li><Link to="/dashboard" className={styles.footLink}>Surveillance</Link></li>
            <li><Link to="/devices"   className={styles.footLink}>Réseau de capteurs</Link></li>
            <li><Link to="/advanced"  className={styles.footLink}>Centre de contrôle</Link></li>
            <li><Link to="/login"     className={styles.footLink}>Connexion</Link></li>
            <li><Link to="/signup"    className={styles.footLink}>Créer un compte</Link></li>
          </ul>
        </div>

        {/* Col 3 — Projet */}
        <div className={styles.col}>
          <h3 className={styles.colTitle}>Projet</h3>
          <ul className={styles.colLinks}>
            <li><Link to="/"                   className={styles.footLink}>Accueil</Link></li>
            <li><Link to="/#fonctionnalites"   className={styles.footLink}>Fonctionnalités</Link></li>
            <li><Link to="/#architecture"      className={styles.footLink}>Architecture</Link></li>
            <li><Link to="/#capteurs"          className={styles.footLink}>Capteurs IoT</Link></li>
          </ul>
        </div>

        {/* Col 4 — Légal */}
        <div className={styles.col}>
          <h3 className={styles.colTitle}>Légal &amp; RGPD</h3>
          <ul className={styles.colLinks}>
            <li>
              <span className={styles.footText}>
                Projet pédagogique ISEP
              </span>
            </li>
            <li>
              <span className={styles.footText}>
                École d'ingénieurs &mdash; promo 2024
              </span>
            </li>
            <li>
              <span className={styles.footText}>
                Groupe G1E · Coupe du Monde IoT
              </span>
            </li>
            <li>
              <span className={styles.footText}>
                Données hébergées : Supabase Inc.
              </span>
            </li>
            <li>
              <span className={styles.footText}>
                Conforme RGPD · UE 2016/679
              </span>
            </li>
          </ul>
        </div>

      </div>

      {/* Barre du bas */}
      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <p className={styles.copyright}>
            © {YEAR} ISEP — Institut Supérieur d'Électronique de Paris.
            Tous droits réservés.
          </p>
          <p className={styles.disclaimer}>
            AMBIENSE est une plateforme de démonstration développée dans un cadre pédagogique.
            Projet G1E · Coupe du Monde IoT · École d'ingénieurs généraliste en informatique
            et technologies du numérique.
          </p>
          <p className={styles.legal}>
            Directeur de la publication&nbsp;: Direction ISEP ·
            Hébergement&nbsp;: Supabase Inc., San Francisco, CA, USA ·
            Conçu avec React 19 &amp; TypeScript ·
            Conforme RGPD
          </p>
        </div>
      </div>
    </footer>
  );
}
