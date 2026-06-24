import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

import "./SubcategoryModal.css";

export default function SubcategoryModal({
  mode, // 'add' | 'edit'
  subcategory,
  categoryId,
  onClose,
  onSaved,
}) {
  const [name, setValue] = useState(subcategory?.name || "");
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
          .from("subcategories")
          .update({ name: name.trim() })
          .eq("id", subcategory.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("subcategories")
          .insert({
            name: name.trim(),
            category_id: categoryId,
          });

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
          {mode === "edit"
            ? "Modifier la sous-catégorie"
            : "Nouvelle sous-catégorie"}
        </h2>

        <label>
          Nom de la sous-catégorie
          <input
            value={name}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            placeholder="Ex: Manuels"
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
