import { useState } from "react";

import "./NameModal.css";

export default function NameModal({ title, onClose, onSubmit }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) {
      setError("Le nom est obligatoire.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(value.trim());
      onClose();
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2>{title}</h2>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nom"
        />
        {error && <p className="gate-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" disabled={saving}>
            {saving ? "Ajout..." : "Ajouter"}
          </button>
        </div>
      </form>
    </div>
  );
}
