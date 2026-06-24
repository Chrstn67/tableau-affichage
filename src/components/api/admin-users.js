// server/api/admin-users.js (ou pages/api/admin-users.js selon votre framework)
// Ce fichier doit être exécuté côté serveur (Node.js)

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client admin avec la clé service role (uniquement côté serveur)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default async function handler(req, res) {
  // Vérifier que l'utilisateur est authentifié et est admin
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  // Vérifier le token JWT de l'utilisateur connecté
  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }

  // Vérifier que l'utilisateur est dans admin_profiles
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("admin_profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return res.status(403).json({ error: "Accès administrateur requis" });
  }

  // Traiter la requête selon la méthode HTTP
  if (req.method === "POST") {
    // Ajouter un collaborateur
    const { email, password, username } = req.body;

    try {
      // Créer l'utilisateur avec l'API admin
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.createUser({
          email: email.trim(),
          password: password,
          email_confirm: true,
          user_metadata: {
            username: username,
          },
        });

      if (userError) {
        if (userError.message.includes("already registered")) {
          return res.status(400).json({ error: "Cet email est déjà utilisé." });
        }
        return res.status(400).json({ error: userError.message });
      }

      // Ajouter dans admin_profiles
      const { error: profileError } = await supabaseAdmin
        .from("admin_profiles")
        .insert({
          id: userData.user.id,
          username: username,
        });

      if (profileError) {
        // Annuler la création de l'utilisateur
        await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
        return res
          .status(500)
          .json({ error: "Erreur lors de l'ajout dans admin_profiles." });
      }

      return res.status(200).json({
        success: true,
        user: userData.user,
        message: `Collaborateur ${username} ajouté avec succès`,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "DELETE") {
    // Supprimer un collaborateur
    const { userId } = req.query;

    try {
      // Supprimer de admin_profiles
      const { error: profileError } = await supabaseAdmin
        .from("admin_profiles")
        .delete()
        .eq("id", userId);

      if (profileError) {
        return res
          .status(500)
          .json({ error: "Erreur lors de la suppression du profil." });
      }

      // Supprimer l'utilisateur
      const { error: userError } =
        await supabaseAdmin.auth.admin.deleteUser(userId);

      if (userError) {
        return res.status(200).json({
          success: true,
          warning:
            "Profil supprimé mais l'utilisateur n'a pas pu être supprimé.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Collaborateur supprimé avec succès",
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
