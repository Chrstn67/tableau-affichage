// create-admin.mjs
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Charge les variables d'environnement
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Identifiants du compte admin à créer
const ADMIN_EMAIL = "christian.hmbrt.theocratica@outlook.com";
const ADMIN_PASSWORD = "tititou*6711031998";
const ADMIN_USERNAME = "Christian";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Variables d'environnement manquantes !");
  console.error(
    "   Assurez-vous d'avoir un fichier .env avec SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log("📧 Création du compte admin...");
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Username: ${ADMIN_USERNAME}`);

  // Vérifier si l'utilisateur existe déjà
  const { data: existingUsers, error: listError } =
    await supabase.auth.admin.listUsers();
  if (listError) {
    console.error(
      "❌ Erreur lors de la vérification des utilisateurs:",
      listError.message,
    );
  } else {
    const exists = existingUsers?.users?.find((u) => u.email === ADMIN_EMAIL);
    if (exists) {
      console.log("⚠️  L'utilisateur existe déjà !");
      console.log(`   ID: ${exists.id}`);
      console.log(
        "   Si vous avez oublié le mot de passe, utilisez la réinitialisation dans Supabase Dashboard.",
      );
      process.exit(0);
    }
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });

  if (error) {
    console.error("❌ Erreur lors de la création du compte :", error.message);
    process.exit(1);
  }

  console.log("✅ Compte créé avec succès.");
  console.log("   id   :", data.user.id);
  console.log("   email:", data.user.email);

  // Ajout dans la table admin_profiles
  const { error: profileError } = await supabase
    .from("admin_profiles")
    .insert({ id: data.user.id, username: ADMIN_USERNAME });

  if (profileError) {
    console.warn(
      "⚠️  Compte créé, mais impossible de l'ajouter à admin_profiles :",
      profileError.message,
    );
  } else {
    console.log("✅ Profil ajouté dans admin_profiles.");
  }

  console.log("\n🔑 Vous pouvez maintenant vous connecter avec :");
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Mot de passe: ${ADMIN_PASSWORD}`);
}

main();
