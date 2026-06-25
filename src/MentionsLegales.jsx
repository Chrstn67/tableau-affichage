// MentionsLegales.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./MentionsLegales.css";

export default function MentionsLegales() {
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const currentYear = new Date().getFullYear();

  // Gérer l'affichage du bouton scroll-to-top
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fonction pour remonter en haut de page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Fonction pour retourner à la page précédente
  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="mentions-legales-container">
      <div className="mentions-legales-content">
        {/* En-tête avec boutons de navigation */}
        <div className="mentions-header">
          <div className="mentions-nav-buttons">
            <button
              onClick={goBack}
              className="mentions-back-button"
              aria-label="Retourner à la page précédente"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Retour
            </button>

            <Link to="/" className="mentions-home-button">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
              </svg>
              Accueil
            </Link>
          </div>
        </div>

        <h1 className="mentions-title">Mentions légales</h1>

        <section className="mentions-section">
          <h2>Éditeur du site</h2>
          <p>
            <strong>Assemblée de Mutzig</strong>
            <br />
            Association cultuelle
            <br />
            2, Passage des Poilus
            <br />
            67120 Mutzig, France
            <br />
          </p>
        </section>

        <section className="mentions-section">
          <h2>Hébergeur</h2>
          <p>
            <strong>Supabase</strong>
            <br />
            Supabase Inc.
            <br />
            101 2nd St, Suite 200, San Francisco, CA 94105, États-Unis
            <br />
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://supabase.com
            </a>
          </p>
        </section>

        <section className="mentions-section">
          <h2>Propriété intellectuelle</h2>
          <p>
            L'ensemble du contenu de ce site (textes, images, logos, documents,
            etc.) est protégé par les lois françaises et internationales
            relatives à la propriété intellectuelle.
            <br />
            <br />
            Toute reproduction, représentation, modification, publication,
            transmission, dénaturation, totale ou partielle du site ou de son
            contenu, par quelque procédé que ce soit, et sur quelque support que
            ce soit, est interdite, sauf autorisation préalable et écrite de
            l'Assemblée de Mutzig.
            <br />
          </p>
        </section>

        <section className="mentions-section">
          <h2>Données personnelles</h2>
          <p>
            Conformément à la loi n° 78-17 du 6 janvier 1978 relative à
            l'informatique, aux fichiers et aux libertés, modifiée par le
            Règlement Général sur la Protection des Données (RGPD - UE
            2016/679), vous disposez d'un droit d'accès, de rectification, de
            suppression et d'opposition aux données vous concernant.
          </p>
          <p>
            <strong>Collecte des données :</strong> Ce site ne collecte aucune
            donnée personnelle sans votre consentement explicite. Les
            informations collectées lors de la création de compte ou de
            l'utilisation du site sont strictement limitées à ce qui est
            nécessaire au bon fonctionnement du service.
          </p>
          <p>
            <strong>Cookies :</strong> Ce site utilise des cookies techniques
            nécessaires à son bon fonctionnement. Aucun cookie de traçage ou de
            publicité n'est utilisé.
            <br />
            <br />
            <strong>Durée de conservation :</strong> Les données personnelles
            sont conservées pour la durée nécessaire à la réalisation des
            finalités pour lesquelles elles ont été collectées, conformément à
            la réglementation en vigueur.
            <br />
            <br />
            <strong>Email :</strong> chrisitan.hmbrt.theocratica@outlook.com
          </p>
        </section>

        <section className="mentions-section">
          <h2>Limitation de responsabilité</h2>
          <p>
            L'Assemblée de Mutzig s'efforce d'assurer l'exactitude et la mise à
            jour des informations diffusées sur ce site, mais ne peut garantir
            l'exhaustivité, l'exactitude ou l'actualité des informations.
            <br />
            <br />
            L'Assemblée de Mutzig décline toute responsabilité pour toute
            interruption, indisponibilité du service, ou pour tout dommage
            direct ou indirect résultant de l'utilisation du site ou de
            l'impossibilité d'y accéder.
            <br />
            <br />
            Les documents publiés sur ce site sont mis à disposition à titre
            informatif. L'Assemblée de Mutzig ne saurait être tenue responsable
            de l'utilisation qui pourrait en être faite.
          </p>
        </section>

        <section className="mentions-section">
          <h2>Loi applicable</h2>
          <p>
            Les présentes mentions légales sont régies par le droit français.
            Tout litige relatif à l'interprétation, l'exécution ou la validité
            des présentes sera de la compétence exclusive des tribunaux
            français.
          </p>
        </section>

        <section className="mentions-section">
          <h2>Accessibilité</h2>
          <p>
            L'Assemblée de Mutzig s'engage à rendre son site accessible
            conformément à l'article 47 de la loi n° 2005-102 du 11 février
            2005. Une déclaration d'accessibilité est disponible sur demande.
          </p>
        </section>

        <section className="mentions-section">
          <h2>Contact</h2>
          <p>
            Pour toute question concernant ces mentions légales, vous pouvez
            contacter l'Assemblée de Mutzig :
            <br />
            <br />
            <strong>Email :</strong> chrisitan.hmbrt.theocratica@outlook.com
            <br />
            <strong>Adresse postale :</strong> Assemblée de Mutzig, 2, Passage
            des Poilus, 67120 Mutzig, France
          </p>
        </section>

        <div className="mentions-footer">
          <p>
            Dernière mise à jour :{" "}
            {new Date().toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p>© {currentYear} Assemblée de Mutzig - Tous droits réservés</p>
        </div>
      </div>

      {/* Bouton "Retour en haut" - apparaît après avoir scrollé */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="mentions-scroll-top"
          aria-label="Retourner en haut de la page"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
