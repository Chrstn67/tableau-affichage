// src/components/pages/HomePage.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Footer from "./Footer";
import "./HomePage.css";

export default function HomePage({ categories = [], documents = [] }) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  return (
    <div className="home-page">
      {/* ── Zone de bienvenue ── */}
      <main className="home-main">
        <div className="home-welcome">
          <div className="home-logo-mark">✦</div>
          <h1 className="home-title">Assemblée de Mutzig</h1>
          <div className="home-divider" />
          <p className="home-greeting">
            Bienvenue sur le tableau d'affichage de notre assemblée. Vous
            trouverez ici les documents, annonces et ressources partagés par les
            responsables.
          </p>

          {/* Rappel de confidentialité */}
          <div className="home-notice">
            <span className="home-notice-icon">🔒</span>
            <p className="home-notice-text">
              Ce site est réservé aux membres de l'assemblée de Mutzig. Merci de
              ne pas partager le lien du site et ses accès avec des personnes
              extérieures.
            </p>
          </div>

          {/* Actions */}
          <div className="home-actions">
            <button
              className="home-btn home-btn--primary"
              onClick={() => navigate("/documents")}
            >
              📄 Accéder au tableau d'affichage
            </button>
            <a
              className="home-btn home-btn--secondary"
              href="https://docs.google.com/spreadsheets/d/1wB8jJoLPu7SOGhXMm9cj7e_VRzu6ZeuYCmv_zZlPgWE/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
            >
              📊 Tableau TPL
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
