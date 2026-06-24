// src/components/admin/ManageCollaborators.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import "./ManageCollaborators.css";

export default function ManageCollaborators({ onClose }) {
  const { adminUser, addCollaborator, removeCollaborator, renameCollaborator } =
    useAuth();

  const [collaborators, setCollaborators] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Champs du formulaire d'ajout
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Renommage inline
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    fetchCollaborators();
  }, []);

  async function fetchCollaborators() {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("id, username, created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setCollaborators(data || []);
    } catch (err) {
      setError("Impossible de charger la liste des collaborateurs.");
    } finally {
      setFetching(false);
    }
  }

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  async function handleAddCollaborator(e) {
    e.preventDefault();
    clearMessages();

    if (!email.trim() || !username.trim() || !password.trim()) {
      setError("Email, nom et mot de passe sont requis.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Veuillez entrer un email valide.");
      return;
    }

    setLoading(true);
    try {
      const result = await addCollaborator(
        email.trim(),
        password,
        username.trim(),
      );
      if (!result.success) {
        setError(result.message);
        return;
      }
      setSuccess(`✅ Collaborateur "${username.trim()}" ajouté avec succès !`);
      setEmail("");
      setUsername("");
      setPassword("");
      await fetchCollaborators();
    } catch (err) {
      setError(err.message || "Erreur lors de l'ajout.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(userId, name) {
    if (!confirm(`Supprimer "${name}" des collaborateurs ?`)) return;
    clearMessages();
    setLoading(true);
    try {
      const result = await removeCollaborator(userId);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setSuccess(
        result.warning ? `⚠️ ${result.warning}` : `✅ "${name}" supprimé.`,
      );
      await fetchCollaborators();
    } catch (err) {
      setError(err.message || "Erreur lors de la suppression.");
    } finally {
      setLoading(false);
    }
  }

  function startEditing(collab) {
    setEditingId(collab.id);
    setEditingName(collab.username);
    clearMessages();
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName("");
  }

  async function handleRename(userId) {
    if (!editingName.trim()) {
      setError("Le nom ne peut pas être vide.");
      return;
    }
    clearMessages();
    setLoading(true);
    try {
      const result = await renameCollaborator(userId, editingName.trim());
      if (!result.success) {
        setError(result.message);
        return;
      }
      setSuccess(`✅ Nom mis à jour.`);
      setEditingId(null);
      await fetchCollaborators();
    } catch (err) {
      setError(err.message || "Erreur lors du renommage.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="collab-modal-overlay" onClick={onClose}>
      <div className="collab-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="collab-modal-header">
          <h2>👥 Gérer les accès</h2>
          <button
            className="collab-close-btn"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="collab-content">
          {/* Formulaire d'ajout */}
          <form onSubmit={handleAddCollaborator} className="collab-add-form">
            <p className="collab-description">
              Ajoutez un collaborateur : seul son nom sera visible sur le site.
            </p>
            <div className="collab-form-group">
              <div className="collab-form-row">
                <input
                  type="email"
                  placeholder="Email (identifiant de connexion)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Nom affiché sur le site"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="collab-form-row">
                <input
                  type="password"
                  placeholder="Mot de passe (min. 6 caractères)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={6}
                />
                <button type="submit" disabled={loading}>
                  {loading ? "Ajout..." : "➕ Ajouter"}
                </button>
              </div>
            </div>
          </form>

          {error && <p className="collab-error">❌ {error}</p>}
          {success && <p className="collab-success">{success}</p>}

          {/* Liste des collaborateurs */}
          <div className="collab-list">
            <h3>Collaborateurs ({collaborators.length})</h3>
            {fetching ? (
              <p className="collab-loading">Chargement...</p>
            ) : collaborators.length === 0 ? (
              <p className="collab-empty">Aucun collaborateur enregistré.</p>
            ) : (
              <ul>
                {collaborators.map((collab) => (
                  <li key={collab.id} className="collab-item">
                    <div className="collab-info">
                      {editingId === collab.id ? (
                        <input
                          className="collab-edit-input"
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          disabled={loading}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(collab.id);
                            if (e.key === "Escape") cancelEditing();
                          }}
                        />
                      ) : (
                        <span className="collab-username">
                          {collab.username || "Sans nom"}
                        </span>
                      )}
                    </div>

                    <div className="collab-actions">
                      {collab.id === adminUser?.id ? (
                        <span className="collab-badge">👤 Vous</span>
                      ) : editingId === collab.id ? (
                        <>
                          <button
                            className="collab-save-btn"
                            onClick={() => handleRename(collab.id)}
                            disabled={loading}
                          >
                            Enregistrer
                          </button>
                          <button
                            className="collab-cancel-btn"
                            onClick={cancelEditing}
                            disabled={loading}
                          >
                            Annuler
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="collab-edit-btn"
                            onClick={() => startEditing(collab)}
                            disabled={loading}
                          >
                            ✏️ Renommer
                          </button>
                          <button
                            className="collab-remove-btn"
                            onClick={() =>
                              handleRemove(collab.id, collab.username)
                            }
                            disabled={loading}
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
