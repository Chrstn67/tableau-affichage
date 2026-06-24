import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

import "./ChangePasswordModal.css";

export default function ChangePasswordModal({ onClose }) {
  const { changeAdminPassword } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setSaving(true);
    const res = await changeAdminPassword(newPassword);
    setSaving(false);

    if (!res.success) {
      setError(res.message);
      return;
    }
    setSuccess(true);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2>Changer le mot de passe admin</h2>

        {success ? (
          <>
            <p>Mot de passe mis à jour avec succès.</p>
            <div className="modal-actions">
              <button type="button" onClick={onClose}>
                Fermer
              </button>
            </div>
          </>
        ) : (
          <>
            <label>
              Nouveau mot de passe
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
              />
            </label>
            <label>
              Confirmer le mot de passe
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>

            {error && <p className="gate-error">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Annuler
              </button>
              <button type="submit" disabled={saving}>
                {saving ? "Enregistrement..." : "Mettre à jour"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
