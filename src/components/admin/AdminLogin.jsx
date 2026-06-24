// AdminLogin.jsx
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

import "./AdminLogin.css";

export default function AdminLogin({ onClose }) {
  const { loginAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await loginAdmin(email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    onClose?.();
  }

  return (
    <div className="admin-login-overlay" onClick={onClose}>
      <form
        className="admin-login-card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2>Connexion admin</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p
            className="gate-error"
            style={{ color: "#dc3545", margin: "8px 0" }}
          >
            {error}
          </p>
        )}
        <div className="admin-login-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </div>
      </form>
    </div>
  );
}
