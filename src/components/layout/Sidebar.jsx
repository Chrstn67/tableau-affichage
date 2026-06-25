import { useState, useEffect, useRef } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState(
    () => new Set(categories.map((c) => c.id)),
  );
  const closeButtonRef = useRef(null);
  const burgerRef = useRef(null);

  // Sync when categories load (if initially empty)
  useEffect(() => {
    setOpenCategories(new Set(categories.map((c) => c.id)));
  }, [categories]);

  function openDrawer() {
    setIsOpen(true);
  }
  function closeDrawer() {
    setIsOpen(false);
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeButtonRef.current?.focus(), 320);
    } else {
      burgerRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) closeDrawer();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function toggle(catId) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  }

  function handleSelect(sel) {
    onSelect(sel);
    // Ferme le drawer en mobile après sélection
    closeDrawer();
  }

  return (
    <>
      {/* ── Burger FAB (tablet/mobile only) ── */}
      <button
        ref={burgerRef}
        className="sidebar-burger-fab"
        onClick={openDrawer}
        aria-label="Ouvrir la navigation"
        aria-expanded={isOpen}
        aria-controls="sidebar-drawer"
        style={{
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? "none" : "auto",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          aria-hidden="true"
        >
          <line
            x1="2"
            y1="4.5"
            x2="16"
            y2="4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="2"
            y1="9"
            x2="16"
            y2="9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="2"
            y1="13.5"
            x2="16"
            y2="13.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* ── Overlay (tablet/mobile only) ── */}
      <div
        className={`sidebar-overlay${isOpen ? " open" : ""}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* ── Drawer ── */}
      <aside
        id="sidebar-drawer"
        className={`sidebar-drawer${isOpen ? " open" : ""}`}
        role="navigation"
        aria-label="Catégories de documents"
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-brand-dot" aria-hidden="true" />
            <span className="sidebar-brand-name">Documents</span>
          </div>
          <button
            ref={closeButtonRef}
            className="sidebar-close-btn"
            onClick={closeDrawer}
            aria-label="Fermer la navigation"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <line
                x1="1"
                y1="1"
                x2="11"
                y2="11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="11"
                y1="1"
                x2="1"
                y2="11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="sidebar-search">
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="5.5"
              cy="5.5"
              r="4"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <line
              x1="8.5"
              y1="8.5"
              x2="12"
              y2="12"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Rechercher…"
            aria-label="Rechercher une catégorie"
          />
        </div>

        {/* Scroll area */}
        <div className="sidebar-scroll">
          {/* All documents */}
          <button
            className={`sidebar-all-btn${selected.type === "all" ? " active" : ""}`}
            onClick={() => handleSelect({ type: "all" })}
          >
            <span className="sidebar-all-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect
                  x="1"
                  y="1"
                  width="5"
                  height="5"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <rect
                  x="8"
                  y="1"
                  width="5"
                  height="5"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <rect
                  x="1"
                  y="8"
                  width="5"
                  height="5"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <rect
                  x="8"
                  y="8"
                  width="5"
                  height="5"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
              </svg>
            </span>
            <span className="sidebar-all-text">Tous les documents</span>
          </button>

          {/* Section label */}
          <div className="sidebar-section-label" aria-hidden="true">
            Catégories
          </div>

          {/* Tree */}
          <ul className="sidebar-tree" role="tree">
            {categories.map((cat) => {
              const isExpanded = openCategories.has(cat.id);
              const isCatActive =
                selected.type === "category" && selected.id === cat.id;

              return (
                <li
                  key={cat.id}
                  role="treeitem"
                  aria-expanded={isExpanded}
                  className="sidebar-cat-item"
                >
                  <div
                    className={`sidebar-cat-row${isCatActive ? " active" : ""}`}
                  >
                    <button
                      className="sidebar-toggle-btn"
                      onClick={() => toggle(cat.id)}
                      aria-label={`${isExpanded ? "Réduire" : "Développer"} ${cat.name}`}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                        aria-hidden="true"
                        style={{
                          transform: isExpanded
                            ? "rotate(90deg)"
                            : "rotate(0deg)",
                          transition: "transform .2s",
                        }}
                      >
                        <path
                          d="M3 2l4 3-4 3"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    <span className="sidebar-cat-dot" aria-hidden="true" />

                    <button
                      className="sidebar-cat-label"
                      onClick={() =>
                        handleSelect({ type: "category", id: cat.id })
                      }
                    >
                      {cat.name}
                    </button>

                    {isAdmin && (
                      <span className="sidebar-row-actions" aria-hidden="true">
                        <button
                          className="sidebar-act-btn"
                          title="Ajouter une sous-catégorie"
                          aria-label={`Ajouter une sous-catégorie à ${cat.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddSubcategory(cat.id);
                          }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                            aria-hidden="true"
                          >
                            <line
                              x1="5"
                              y1="1"
                              x2="5"
                              y2="9"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                            <line
                              x1="1"
                              y1="5"
                              x2="9"
                              y2="5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                        <button
                          className="sidebar-act-btn danger"
                          title="Supprimer la catégorie"
                          aria-label={`Supprimer ${cat.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCategory(cat.id);
                          }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M2 3h6M4 3V2h2v1M4.5 5v2.5M5.5 5v2.5M3 3l.5 5h3L7 3"
                              stroke="currentColor"
                              strokeWidth="1.3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </span>
                    )}

                    <span className="sidebar-active-bar" aria-hidden="true" />
                  </div>

                  {isExpanded && (
                    <ul className="sidebar-sub-list" role="group">
                      {cat.subcategories.length === 0 ? (
                        <li className="sidebar-empty-hint" role="note">
                          Aucune sous-catégorie
                        </li>
                      ) : (
                        cat.subcategories.map((sub) => {
                          const isSubActive =
                            selected.type === "subcategory" &&
                            selected.id === sub.id;
                          return (
                            <li
                              key={sub.id}
                              role="treeitem"
                              className={`sidebar-sub-row${isSubActive ? " active" : ""}`}
                            >
                              <button
                                className="sidebar-sub-label"
                                onClick={() =>
                                  handleSelect({
                                    type: "subcategory",
                                    id: sub.id,
                                  })
                                }
                              >
                                {sub.name}
                              </button>

                              {isAdmin && (
                                <span
                                  className="sidebar-row-actions"
                                  aria-hidden="true"
                                >
                                  <button
                                    className="sidebar-act-btn danger"
                                    title="Supprimer la sous-catégorie"
                                    aria-label={`Supprimer ${sub.name}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSubcategory(sub.id);
                                    }}
                                  >
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 10 10"
                                      fill="none"
                                      aria-hidden="true"
                                    >
                                      <path
                                        d="M2 3h6M4 3V2h2v1M4.5 5v2.5M5.5 5v2.5M3 3l.5 5h3L7 3"
                                        stroke="currentColor"
                                        strokeWidth="1.3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </button>
                                </span>
                              )}

                              <span
                                className="sidebar-active-bar"
                                aria-hidden="true"
                              />
                            </li>
                          );
                        })
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer */}
        {isAdmin && (
          <div className="sidebar-footer">
            <button
              className="sidebar-footer-btn"
              onClick={onAddCategory}
              aria-label="Ajouter une catégorie"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 13 13"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="1"
                  y="1"
                  width="5"
                  height="5"
                  rx="1.2"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <rect
                  x="1"
                  y="7"
                  width="5"
                  height="5"
                  rx="1.2"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <rect
                  x="7"
                  y="1"
                  width="5"
                  height="5"
                  rx="1.2"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <line
                  x1="9.5"
                  y1="8"
                  x2="9.5"
                  y2="12"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
                <line
                  x1="7.5"
                  y1="10"
                  x2="11.5"
                  y2="10"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              Catégorie
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
