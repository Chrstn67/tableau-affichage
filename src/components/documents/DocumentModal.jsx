import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

import "./DocumentModal.css";

export default function DocumentModal({
  categories,
  editingDoc,
  defaultCategoryId,
  onClose,
  onSaved,
}) {
  const [title, setTitle] = useState(editingDoc?.title || "");
  const [categoryId, setCategoryId] = useState(
    editingDoc?.category_id || defaultCategoryId || categories[0]?.id || "",
  );
  const [subcategoryId, setSubcategoryId] = useState(
    editingDoc?.subcategory_id || "",
  );
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const currentCategory = categories.find(
    (c) => String(c.id) === String(categoryId),
  );
  const subcategories = currentCategory?.subcategories || [];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }
    if (!categoryId) {
      setError("Choisis une catégorie.");
      return;
    }
    if (!editingDoc && !file) {
      setError("Sélectionne un fichier PDF.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let filePath = editingDoc?.file_path;
      let fileUrl = editingDoc?.file_url;

      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const path = `${categoryId}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("pdfs")
          .upload(path, file, {
            contentType: "application/pdf",
          });
        if (uploadError) throw uploadError;

        if (editingDoc?.file_path) {
          await supabase.storage.from("pdfs").remove([editingDoc.file_path]);
        }

        filePath = path;
        const { data: publicUrlData } = supabase.storage
          .from("pdfs")
          .getPublicUrl(path);
        fileUrl = publicUrlData.publicUrl;
      }

      const payload = {
        title: title.trim(),
        category_id: categoryId,
        subcategory_id: subcategoryId || null,
        file_path: filePath,
        file_url: fileUrl,
      };

      if (editingDoc) {
        const { error: updateError } = await supabase
          .from("documents")
          .update(payload)
          .eq("id", editingDoc.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("documents")
          .insert(payload);
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
        <h2>{editingDoc ? "Modifier le document" : "Ajouter un document"}</h2>

        <label>
          Titre
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </label>

        <label>
          Catégorie
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubcategoryId("");
            }}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sous-catégorie (optionnel)
          <select
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
          >
            <option value="">Aucune</option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Fichier PDF{" "}
          {editingDoc && "(laisser vide pour garder le fichier actuel)"}
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>

        {error && <p className="gate-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
