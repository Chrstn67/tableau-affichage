import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

import "./PasswordGate.css";

export default function PasswordGate({ children }) {
  const { siteUnlocked, unlockSite } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (siteUnlocked) return children;

  function handleSubmit(e) {
    e.preventDefault();
    const ok = unlockSite(password);
    if (!ok) {
      setError("Mot de passe incorrect.");
      setPassword("");
    }
  }

  return (
    <div className="gate-screen">
      <form className="gate-card" onSubmit={handleSubmit}>
        <h1>Tableau d'affichage</h1>
        <p>Entrez le mot de passe pour accéder au site.</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
        />
        {error && <p className="gate-error">{error}</p>}
        <button type="submit">Entrer</button>
      </form>
    </div>
  );
}
