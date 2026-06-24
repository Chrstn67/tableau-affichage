// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Client standard (avec clé anon) - C'est le seul client exposé au frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
