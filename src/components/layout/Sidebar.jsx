import { useState } from "react";
import "./Sidebar.css";

export default function Sidebar({
  categories,
  selected,
  onSelect,
  isAdmin,
  onAddCategory,
  onAddSubcategory,
  onDeleteCategory,
  onDeleteSubcategory,
}) {
  const [openCategories, setOpenCategories] = useState(() => new Set());

  function toggle(catId) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Catégories</h2>
        {isAdmin && (
          <button
            className="btn-icon"
            title="Ajouter une catégorie"
            onClick={onAddCategory}
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
              <div className={`category-row ${isCatSelected ? "active" : ""}`}>
                <button
                  className="category-toggle"
                  onClick={() => toggle(cat.id)}
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
                      onClick={() => onAddSubcategory(cat.id)}
                    >
                      +
                    </button>
                    <button
                      className="btn-icon small danger"
                      title="Supprimer la catégorie"
                      onClick={() => onDeleteCategory(cat.id)}
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
                      selected.type === "subcategory" && selected.id === sub.id;
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
                          <button
                            className="btn-icon small danger"
                            title="Supprimer la sous-catégorie"
                            onClick={() => onDeleteSubcategory(sub.id)}
                          >
                            ×
                          </button>
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
  );
}
