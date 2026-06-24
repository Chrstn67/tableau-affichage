// src/components/TopBar.jsx
import { useAuth } from "../context/AuthContext";
import "./TopBar.css";

export default function TopBar({
  isAdmin,
  onAddDocument,
  onManageCollaborators,
  onChangePassword,
}) {
  const { adminUser, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">Tableau d'affichage</h1>
      </div>

      <div className="topbar-right">
        {isAdmin && (
          <>
            <button className="topbar-btn primary" onClick={onAddDocument}>
              + Ajouter un document
            </button>
            <button className="topbar-btn" onClick={onManageCollaborators}>
              👥 Collaborateurs
            </button>
            <button className="topbar-btn" onClick={onChangePassword}>
              🔑 Changer mot de passe
            </button>
          </>
        )}

        {adminUser && (
          <span className="topbar-user">
            {adminUser.username || adminUser.email}
          </span>
        )}

        <button className="topbar-btn logout" onClick={logout}>
          Déconnexion
        </button>
      </div>
    </header>
  );
}
