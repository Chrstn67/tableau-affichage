// server.js
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Middleware : vérifie que le token appartient à un admin
async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Non autorisé" });

  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user)
    return res.status(401).json({ error: "Utilisateur non authentifié" });

  const { data: profile } = await supabaseAdmin
    .from("admin_profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile)
    return res.status(403).json({ error: "Accès administrateur requis" });

  req.adminUser = user;
  next();
}

// POST /api/admin-users — Ajouter un collaborateur
app.post("/api/admin-users", requireAdmin, async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res
      .status(400)
      .json({ error: "Email, mot de passe et nom sont requis." });
  }

  try {
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.trim(),
        password: password,
        email_confirm: true,
        user_metadata: { username },
      });

    if (userError) {
      if (userError.message.includes("already registered")) {
        return res.status(400).json({ error: "Cet email est déjà utilisé." });
      }
      return res.status(400).json({ error: userError.message });
    }

    const { error: profileError } = await supabaseAdmin
      .from("admin_profiles")
      .insert({ id: userData.user.id, username: username.trim() });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return res
        .status(500)
        .json({ error: "Erreur lors de l'ajout dans admin_profiles." });
    }

    return res.status(200).json({
      success: true,
      user: { id: userData.user.id, username: username.trim() },
      message: `Collaborateur "${username}" ajouté avec succès`,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin-users — Supprimer un collaborateur
app.delete("/api/admin-users", requireAdmin, async (req, res) => {
  // userId peut venir de la query string (?userId=...) ou du body
  const userId = req.query.userId || req.body.userId;

  if (!userId) {
    return res.status(400).json({ error: "userId manquant." });
  }

  try {
    const { error: profileError } = await supabaseAdmin
      .from("admin_profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      return res
        .status(500)
        .json({ error: "Erreur lors de la suppression du profil." });
    }

    const { error: userError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (userError) {
      return res.status(200).json({
        success: true,
        warning:
          "Profil supprimé, mais l'utilisateur Auth n'a pas pu être supprimé.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Collaborateur supprimé avec succès",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin-users — Renommer un collaborateur
app.patch("/api/admin-users", requireAdmin, async (req, res) => {
  const { userId, username } = req.body;

  if (!userId || !username) {
    return res.status(400).json({ error: "userId et username sont requis." });
  }

  try {
    const { error } = await supabaseAdmin
      .from("admin_profiles")
      .update({ username: username.trim() })
      .eq("id", userId);

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ success: true, message: "Nom mis à jour." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
