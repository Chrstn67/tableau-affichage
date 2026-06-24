// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

const SITE_PASSWORD = import.meta.env.VITE_SITE_PASSWORD;

export function AuthProvider({ children }) {
  const [siteUnlocked, setSiteUnlocked] = useState(() => {
    return sessionStorage.getItem("site_unlocked") === "true";
  });
  const [adminUser, setAdminUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("admin_profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            setAdminUser(profile);
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error("Erreur de session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("admin_profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setAdminUser(profile);
          setIsAdmin(true);
        } else {
          setAdminUser(null);
          setIsAdmin(false);
        }
      } else {
        setAdminUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  function unlockSite(password) {
    const ok = password === SITE_PASSWORD;
    if (ok) {
      setSiteUnlocked(true);
      sessionStorage.setItem("site_unlocked", "true");
    }
    return ok;
  }

  function lockSite() {
    setSiteUnlocked(false);
    sessionStorage.removeItem("site_unlocked");
  }

  async function loginAdmin(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          return {
            success: false,
            message: "Email ou mot de passe incorrect.",
          };
        }
        return { success: false, message: error.message };
      }

      if (!data.user)
        return { success: false, message: "Utilisateur non trouvé." };

      const { data: profile, error: profileError } = await supabase
        .from("admin_profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        return {
          success: false,
          message: "Vous n'avez pas les droits administrateur.",
        };
      }

      setAdminUser(profile);
      setIsAdmin(true);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: "Une erreur est survenue lors de la connexion.",
      };
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err);
    } finally {
      setAdminUser(null);
      setIsAdmin(false);
      lockSite();
      window.location.reload();
    }
  }

  async function changeAdminPassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) return { success: false, message: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, message: "Une erreur est survenue." };
    }
  }

  // Récupère le token de session courant
  async function getSessionToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  // Ajouter un collaborateur
  async function addCollaborator(email, password, username) {
    try {
      const token = await getSessionToken();
      if (!token)
        return { success: false, message: "Vous devez être connecté." };

      const response = await fetch("/api/admin-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          username: username.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.error || "Erreur lors de l'ajout.",
        };
      }
      return { success: true, user: result.user, message: result.message };
    } catch (err) {
      return {
        success: false,
        message: err.message || "Une erreur est survenue.",
      };
    }
  }

  // Supprimer un collaborateur
  async function removeCollaborator(userId) {
    try {
      const token = await getSessionToken();
      if (!token)
        return { success: false, message: "Vous devez être connecté." };

      const response = await fetch(`/api/admin-users?userId=${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.error || "Erreur lors de la suppression.",
        };
      }
      return {
        success: true,
        warning: result.warning,
        message: result.message,
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || "Une erreur est survenue.",
      };
    }
  }

  // Renommer un collaborateur
  async function renameCollaborator(userId, newUsername) {
    try {
      const token = await getSessionToken();
      if (!token)
        return { success: false, message: "Vous devez être connecté." };

      const response = await fetch("/api/admin-users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, username: newUsername.trim() }),
      });

      const result = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: result.error || "Erreur lors du renommage.",
        };
      }
      return { success: true, message: result.message };
    } catch (err) {
      return {
        success: false,
        message: err.message || "Une erreur est survenue.",
      };
    }
  }

  const value = {
    siteUnlocked,
    adminUser,
    isAdmin,
    loading,
    unlockSite,
    lockSite,
    loginAdmin,
    logout,
    changeAdminPassword,
    addCollaborator,
    removeCollaborator,
    renameCollaborator,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth doit être utilisé à l'intérieur d'un AuthProvider",
    );
  }
  return context;
}
