import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import CategoryModal from "./CategoryModal";
import SubcategoryModal from "./SubcategoryModal";

import "./CategoryManager.css";

export default function CategoryManager({
  categories,
  selected,
  onSelect,
  isAdmin,
  onCategoriesChange,
}) {
  const [openCategories, setOpenCategories] = useState(() => new Set());
  const [modal, setModal] = useState(null); // { type: 'category'|'subcategory', mode: 'add'|'edit', data: {...} }

  function toggle(catId) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  }

  async function handleDeleteCategory(categoryId) {
    if (!confirm("Supprimer cette catégorie et toutes ses sous-catégories ?"))
      return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      if (selected.type === "category" && selected.id === categoryId) {
        onSelect({ type: "all" });
      }
      onCategoriesChange();
    } catch (error) {
      alert("Erreur lors de la suppression: " + error.message);
    }
  }

  async function handleDeleteSubcategory(subId) {
    if (!confirm("Supprimer cette sous-catégorie ?")) return;

    try {
      const { error } = await supabase
        .from("subcategories")
        .delete()
        .eq("id", subId);

      if (error) throw error;

      if (selected.type === "subcategory" && selected.id === subId) {
        onSelect({ type: "all" });
      }
      onCategoriesChange();
    } catch (error) {
      alert("Erreur lors de la suppression: " + error.message);
    }
  }

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Catégories</h2>
          {isAdmin && (
            <button
              className="btn-icon"
              title="Ajouter une catégorie"
              onClick={() => setModal({ type: "category", mode: "add" })}
            >
              +
            </button>
          )}
        </div>

        <button
          className={`sidebar-item all ${selected.type === "all" ? "active" : ""}`}
          onClick={() => onSelect({ type: "all" })}
        >
          Tous les documents
        </button>

        <ul className="category-tree">
          {categories.map((cat) => {
            const isOpen = openCategories.has(cat.id);
            const isCatSelected =
              selected.type === "category" && selected.id === cat.id;

            return (
              <li key={cat.id}>
                <div
                  className={`category-row ${isCatSelected ? "active" : ""}`}
                >
                  <button
                    className="category-toggle"
                    onClick={() => toggle(cat.id)}
                    aria-label={isOpen ? "Réduire" : "Développer"}
                  >
                    {isOpen ? "▾" : "▸"}
                  </button>

                  <button
                    className="category-name"
                    onClick={() => onSelect({ type: "category", id: cat.id })}
                  >
                    {cat.name}
                  </button>

                  {isAdmin && (
                    <span className="row-actions">
                      <button
                        className="btn-icon small"
                        title="Ajouter une sous-catégorie"
                        onClick={() =>
                          setModal({
                            type: "subcategory",
                            mode: "add",
                            data: { categoryId: cat.id },
                          })
                        }
                      >
                        +
                      </button>
                      <button
                        className="btn-icon small edit"
                        title="Modifier la catégorie"
                        onClick={() =>
                          setModal({
                            type: "category",
                            mode: "edit",
                            data: cat,
                          })
                        }
                      >
                        ✎
                      </button>
                      <button
                        className="btn-icon small danger"
                        title="Supprimer la catégorie"
                        onClick={() => handleDeleteCategory(cat.id)}
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>

                {isOpen && (
                  <ul className="subcategory-list">
                    {cat.subcategories.map((sub) => {
                      const isSubSelected =
                        selected.type === "subcategory" &&
                        selected.id === sub.id;

                      return (
                        <li
                          key={sub.id}
                          className={`subcategory-row ${isSubSelected ? "active" : ""}`}
                        >
                          <button
                            className="subcategory-name"
                            onClick={() =>
                              onSelect({ type: "subcategory", id: sub.id })
                            }
                          >
                            {sub.name}
                          </button>

                          {isAdmin && (
                            <span className="row-actions">
                              <button
                                className="btn-icon small edit"
                                title="Modifier la sous-catégorie"
                                onClick={() =>
                                  setModal({
                                    type: "subcategory",
                                    mode: "edit",
                                    data: sub,
                                  })
                                }
                              >
                                ✎
                              </button>
                              <button
                                className="btn-icon small danger"
                                title="Supprimer la sous-catégorie"
                                onClick={() => handleDeleteSubcategory(sub.id)}
                              >
                                ×
                              </button>
                            </span>
                          )}
                        </li>
                      );
                    })}
                    {cat.subcategories.length === 0 && (
                      <li className="empty-hint">Aucune sous-catégorie</li>
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Modals */}
      {modal?.type === "category" && (
        <CategoryModal
          mode={modal.mode}
          category={modal.data}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            onCategoriesChange();
          }}
        />
      )}

      {modal?.type === "subcategory" && (
        <SubcategoryModal
          mode={modal.mode}
          subcategory={modal.data}
          categoryId={modal.data?.category_id}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            onCategoriesChange();
          }}
        />
      )}
    </>
  );
}
