import "./Footer.css";

export default function Footer({
  logoSrc = "/Logo.jpg",
  logoAlt = "Logo Assemblée",
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* Logo - s'affiche toujours avec l'image par défaut */}
        <img src={logoSrc} alt={logoAlt} className="footer-logo" />

        {/* Texte */}
        <div className="footer-about">
          <span className="footer-about-title">À propos</span>
          <span className="footer-about-text">
            Site à l'usage exclusif des membres de l'assemblée de Mutzig. Bonne
            consultation — <em>Avec tout notre amour chrétien.</em>
          </span>
        </div>

        {/* Liens & copyright */}
        <div className="footer-meta">
          <span className="footer-copy">
            Tous droits réservés. Reproduction interdite.
          </span>

          <span className="footer-copy">© {year} Assemblée de Mutzig</span>
        </div>
      </div>
    </footer>
  );
}
