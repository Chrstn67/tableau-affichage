// src/App.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "./lib/supabaseClient";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/layout/Sidebar";
import DocumentGrid from "./components/documents/DocumentGrid";
import DocumentModal from "./components/documents/DocumentModal";
import NameModal from "./components/common/NameModal";
import AdminLogin from "./components/admin/AdminLogin";
import ChangePasswordModal from "./components/admin/ChangePasswordModal";
import ManageCollaborators from "./components/admin/ManageCollaborators";

import Footer from "./Footer";

import "./App.css";

export default function App() {
  const { isAdmin, logout } = useAuth();

  const [categories, setCategories] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState({ type: "all" });
  const [search, setSearch] = useState("");

  const [showLogin, setShowLogin] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [nameModal, setNameModal] = useState(null);

  const loadCategories = useCallback(async () => {
    const { data: cats } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");
    const { data: subs } = await supabase
      .from("subcategories")
      .select("id, name, category_id")
      .order("name");

    const merged = (cats || []).map((cat) => ({
      ...cat,
      subcategories: (subs || []).filter((s) => s.category_id === cat.id),
    }));
    setCategories(merged);
  }, []);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("documents")
      .select(
        "id, title, file_path, file_url, created_at, category_id, subcategory_id, categories(name), subcategories(name)",
      )
      .order("created_at", { ascending: false });

    const mapped = (data || []).map((d) => ({
      ...d,
      category_name: d.categories?.name,
      subcategory_name: d.subcategories?.name,
    }));
    setDocuments(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
    loadDocuments();
  }, [loadCategories, loadDocuments]);

  const filteredDocuments = useMemo(() => {
    let result = documents;

    if (selected.type === "category") {
      result = result.filter((d) => d.category_id === selected.id);
    } else if (selected.type === "subcategory") {
      result = result.filter((d) => d.subcategory_id === selected.id);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((d) => d.title.toLowerCase().includes(q));
    }

    return result;
  }, [documents, selected, search]);

  async function handleAddCategory() {
    setNameModal({ mode: "category" });
  }

  async function handleAddSubcategory(categoryId) {
    setNameModal({ mode: "subcategory", categoryId });
  }

  async function handleDeleteCategory(categoryId) {
    if (!confirm("Supprimer cette catégorie et tout son contenu ?")) return;
    await supabase.from("categories").delete().eq("id", categoryId);
    if (selected.type === "category" && selected.id === categoryId) {
      setSelected({ type: "all" });
    }
    loadCategories();
    loadDocuments();
  }

  async function handleDeleteSubcategory(subId) {
    if (!confirm("Supprimer cette sous-catégorie ?")) return;
    await supabase.from("subcategories").delete().eq("id", subId);
    if (selected.type === "subcategory" && selected.id === subId) {
      setSelected({ type: "all" });
    }
    loadCategories();
    loadDocuments();
  }

  async function handleDeleteDocument(doc) {
    if (!confirm(`Supprimer le document "${doc.title}" ?`)) return;
    if (doc.file_path) {
      await supabase.storage.from("pdfs").remove([doc.file_path]);
    }
    await supabase.from("documents").delete().eq("id", doc.id);
    loadDocuments();
  }

  function handleEditDocument(doc) {
    setEditingDoc(doc);
    setShowDocModal(true);
  }

  function handleAddDocument() {
    setEditingDoc(null);
    setShowDocModal(true);
  }

  const defaultCategoryId =
    selected.type === "category"
      ? selected.id
      : selected.type === "subcategory"
        ? documents.find((d) => d.subcategory_id === selected.id)?.category_id
        : undefined;

  return (
    <div className="app-layout">
      <Sidebar
        categories={categories}
        selected={selected}
        onSelect={setSelected}
        isAdmin={isAdmin}
        onAddCategory={handleAddCategory}
        onAddSubcategory={handleAddSubcategory}
        onDeleteCategory={handleDeleteCategory}
        onDeleteSubcategory={handleDeleteSubcategory}
      />

      <main className="main-content">
        <header className="top-bar">
          <h1>
            Tableau d'affichage virtuel - <br />
            Assemblée de Mutzig
          </h1>

          <div className="search-wrapper">
            <input
              className="search-input"
              placeholder="Rechercher un document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="top-bar-actions">
            <a
              className="btn-tpl"
              href="https://docs.google.com/spreadsheets/d/1wB8jJoLPu7SOGhXMm9cj7e_VRzu6ZeuYCmv_zZlPgWE/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
            >
              TPL
            </a>

            {isAdmin ? (
              <>
                <button onClick={handleAddDocument}>
                  + Ajouter un document
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setShowCollaborators(true)}
                >
                  👥 Gérer les accès
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setShowChangePassword(true)}
                >
                  Changer mon mot de passe
                </button>
                <button className="btn-secondary" onClick={logout}>
                  Déconnexion admin
                </button>
              </>
            ) : (
              <button
                className="btn-secondary"
                onClick={() => setShowLogin(true)}
              >
                Connexion admin
              </button>
            )}
          </div>
        </header>

        <DocumentGrid
          documents={filteredDocuments}
          isAdmin={isAdmin}
          onDelete={handleDeleteDocument}
          onEdit={handleEditDocument}
          loading={loading}
        />
      </main>

      {showLogin && <AdminLogin onClose={() => setShowLogin(false)} />}

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {showCollaborators && (
        <ManageCollaborators onClose={() => setShowCollaborators(false)} />
      )}

      {showDocModal && (
        <DocumentModal
          categories={categories}
          editingDoc={editingDoc}
          defaultCategoryId={defaultCategoryId}
          onClose={() => setShowDocModal(false)}
          onSaved={() => {
            setShowDocModal(false);
            loadDocuments();
          }}
        />
      )}

      {nameModal?.mode === "category" && (
        <NameModal
          title="Nouvelle catégorie"
          onClose={() => setNameModal(null)}
          onSubmit={async (name) => {
            const { error } = await supabase
              .from("categories")
              .insert({ name });
            if (error) throw error;
            await loadCategories();
          }}
        />
      )}

      {nameModal?.mode === "subcategory" && (
        <NameModal
          title="Nouvelle sous-catégorie"
          onClose={() => setNameModal(null)}
          onSubmit={async (name) => {
            const { error } = await supabase
              .from("subcategories")
              .insert({ name, category_id: nameModal.categoryId });
            if (error) throw error;
            await loadCategories();
          }}
        />
      )}
      <Footer />
    </div>
  );
}
