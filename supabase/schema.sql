-- ============================================================
-- Schéma Supabase pour le tableau d'affichage PDF
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- Table des catégories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Table des sous-catégories
create table if not exists subcategories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid not null references categories(id) on delete cascade,
  created_at timestamptz default now()
);

-- Table des documents
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid not null references categories(id) on delete cascade,
  subcategory_id uuid references subcategories(id) on delete set null,
  file_path text not null,
  file_url text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- Table des profils admin (collaborateurs)
-- ============================================================

create table if not exists admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  created_at timestamptz default now()
);

-- ============================================================
-- Activation de la sécurité au niveau des lignes (RLS)
-- ============================================================

alter table categories enable row level security;
alter table subcategories enable row level security;
alter table documents enable row level security;
alter table admin_profiles enable row level security;

-- Lecture publique pour tout le monde (visiteurs avec le mot de passe site)
create policy "Lecture publique categories" on categories
  for select using (true);

create policy "Lecture publique subcategories" on subcategories
  for select using (true);

create policy "Lecture publique documents" on documents
  for select using (true);

-- Écriture (insert / update / delete) réservée aux comptes admin connectés
create policy "Admin insert categories" on categories
  for insert to authenticated with check (true);
create policy "Admin update categories" on categories
  for update to authenticated using (true);
create policy "Admin delete categories" on categories
  for delete to authenticated using (true);

create policy "Admin insert subcategories" on subcategories
  for insert to authenticated with check (true);
create policy "Admin update subcategories" on subcategories
  for update to authenticated using (true);
create policy "Admin delete subcategories" on subcategories
  for delete to authenticated using (true);

create policy "Admin insert documents" on documents
  for insert to authenticated with check (true);
create policy "Admin update documents" on documents
  for update to authenticated using (true);
create policy "Admin delete documents" on documents
  for delete to authenticated using (true);

-- Seuls les admins connectés peuvent voir la liste des collaborateurs.
-- Aucun insert/update/delete direct depuis le client : tout passe par
-- les Edge Functions "add-admin" et "remove-admin" (clé service_role).
create policy "Admin lecture admin_profiles" on admin_profiles
  for select to authenticated using (true);

-- ============================================================
-- Stockage des PDF (bucket "pdfs")
-- ============================================================
-- Crée d'abord le bucket "pdfs" via Storage > New bucket (Public: oui)
-- puis exécute les policies ci-dessous.

insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', true)
on conflict (id) do nothing;

create policy "Lecture publique des PDF" on storage.objects
  for select using (bucket_id = 'pdfs');

create policy "Admin upload des PDF" on storage.objects
  for insert to authenticated with check (bucket_id = 'pdfs');

create policy "Admin suppression des PDF" on storage.objects
  for delete to authenticated using (bucket_id = 'pdfs');

create policy "Admin modification des PDF" on storage.objects
  for update to authenticated using (bucket_id = 'pdfs');

-- ============================================================
-- Ajout de ton compte admin existant dans admin_profiles
-- ============================================================

insert into admin_profiles (id, username)
select id, 'christian'
from auth.users
where email = 'christian.hmbrt.theocratica@outlook.com'
on conflict (id) do nothing;