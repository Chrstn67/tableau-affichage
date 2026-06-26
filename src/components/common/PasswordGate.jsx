// src/components/common/PasswordGate.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import "./PasswordGate.css";

export default function PasswordGate({ children }) {
  const { siteUnlocked, unlockSite } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Enregistrer la visite au chargement (si pas déjà fait dans la session)
  useEffect(() => {
    const sessionKey = "visit_recorded_session";
    if (sessionStorage.getItem(sessionKey)) return;

    // Récupérer l'IP (via un service externe, ou laisser Supabase la détecter)
    const recordVisit = async () => {
      try {
        // Utiliser l'IP du client si disponible
        let ip = null;
        try {
          const ipRes = await fetch("https://api.ipify.org?format=json");
          const ipData = await ipRes.json();
          ip = ipData.ip;
        } catch {
          // Ignorer si l'IP n'est pas accessible
        }

        await supabase.from("visits").insert({
          ip_address: ip,
          user_agent: navigator.userAgent,
          session_id: sessionStorage.getItem("session_id") || null,
        });

        sessionStorage.setItem(sessionKey, "true");
      } catch (err) {
        console.error("Erreur enregistrement visite:", err);
      }
    };

    // Générer un ID de session si pas déjà présent
    if (!sessionStorage.getItem("session_id")) {
      sessionStorage.setItem(
        "session_id",
        crypto.randomUUID?.() || Date.now().toString(),
      );
    }

    recordVisit();
  }, []);

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
