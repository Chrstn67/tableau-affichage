import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

import "./CategoryModal.css";

export default function CategoryModal({
  mode, // 'add' | 'edit'
  category,
  onClose,
  onSaved,
}) {
  const [name, setValue] = useState(category?.name || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Le nom est obligatoire.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (mode === "edit") {
        const { error: updateError } = await supabase
          .from("categories")
          .update({ name: name.trim() })
          .eq("id", category.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("categories")
          .insert({ name: name.trim() });

        if (insertError) throw insertError;
      }

      onSaved();
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
        <h2>
          {mode === "edit" ? "Modifier la catégorie" : "Nouvelle catégorie"}
        </h2>

        <label>
          Nom de la catégorie
          <input
            value={name}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            placeholder="Ex: Documentation"
          />
        </label>

        {error && <p className="error-message">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" disabled={saving}>
            {saving
              ? "Enregistrement..."
              : mode === "edit"
                ? "Modifier"
                : "Ajouter"}
          </button>
        </div>
      </form>
    </div>
  );
}
