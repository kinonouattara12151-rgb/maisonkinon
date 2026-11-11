-- ═══════════════════════════════════════════════
--  MAISON KINON — Schéma Supabase
--  Coller dans : Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════

-- ── 1. Profils utilisateurs (lié à auth.users) ──
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text not null default '',
  last_name   text not null default '',
  email       text not null default '',
  created_at  timestamptz default now()
);

-- Trigger : crée automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 2. Commandes ──
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  total       numeric(10,2) not null default 0,
  status      text not null default 'confirmée'
                check (status in ('confirmée','en préparation','expédiée','livrée')),
  created_at  timestamptz default now()
);

-- ── 3. Articles de commande ──
create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  product_id    integer not null,
  product_name  text not null,
  brand         text not null default '',
  price         numeric(10,2) not null,
  quantity      integer not null default 1,
  image         text not null default ''
);

-- ── 4. Panier ──
create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  integer not null,
  quantity    integer not null default 1,
  created_at  timestamptz default now(),
  unique (user_id, product_id)
);

-- ── 5. Favoris ──
create table if not exists public.wishlist_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  integer not null,
  created_at  timestamptz default now(),
  unique (user_id, product_id)
);

-- ── 6. Row Level Security ──
-- Chaque utilisateur ne voit que SES données

alter table public.profiles      enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.cart_items     enable row level security;
alter table public.wishlist_items enable row level security;

-- Profils
create policy "profiles: lecture par l'utilisateur"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: mise à jour par l'utilisateur"
  on public.profiles for update
  using (auth.uid() = id);

-- Commandes
create policy "orders: lecture par l'utilisateur"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "orders: création par l'utilisateur"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- Articles de commande (lecture via la commande)
create policy "order_items: lecture"
  on public.order_items for select
  using (exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
  ));

create policy "order_items: création"
  on public.order_items for insert
  with check (exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
  ));

-- Panier
create policy "cart: lecture"
  on public.cart_items for select using (auth.uid() = user_id);
create policy "cart: création"
  on public.cart_items for insert with check (auth.uid() = user_id);
create policy "cart: mise à jour"
  on public.cart_items for update using (auth.uid() = user_id);
create policy "cart: suppression"
  on public.cart_items for delete using (auth.uid() = user_id);

-- Favoris
create policy "wishlist: lecture"
  on public.wishlist_items for select using (auth.uid() = user_id);
create policy "wishlist: création"
  on public.wishlist_items for insert with check (auth.uid() = user_id);
create policy "wishlist: suppression"
  on public.wishlist_items for delete using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════
--  MIGRATION — Ajout colonnes livraison dans orders
--  Coller dans SQL Editor et exécuter
-- ═══════════════════════════════════════════════
alter table public.orders
  add column if not exists phone          text not null default '',
  add column if not exists city           text not null default '',
  add column if not exists commune        text not null default '',
  add column if not exists preferred_date text not null default '',
  add column if not exists preferred_time text not null default '',
  add column if not exists delivery_notes text not null default '',
  add column if not exists customer_name  text not null default '',
  add column if not exists customer_email text not null default '';

-- ═══════════════════════════════════════════════
--  MIGRATION — Table produits (catalogue administrable)
--  Permet la persistance CRUD des produits depuis l'admin.
-- ═══════════════════════════════════════════════

-- ── 7. Produits du catalogue ──
create table if not exists public.products (
  id          integer primary key,
  brand       text not null default '',
  name        text not null,
  volume      text not null default '',
  price       numeric(10,2) not null default 0,
  original_price numeric(10,2),
  image       text not null default '',
  images      jsonb default '[]'::jsonb,
  badge       text,
  gender      text not null default 'Unisexe',
  family      text not null default '',
  origine     text default '',
  conseils_utilisation text default '',
  tenue       text default '',
  effet_sillage text default '',
  notes       jsonb default '{}'::jsonb,
  description text default '',
  created_at  timestamptz default now()
);

-- ── RLS : lecture publique, écriture réservée aux authentifiés ──
alter table public.products enable row level security;

create policy "products: lecture publique"
  on public.products for select
  using (true);

create policy "products: création par utilisateur authentifié"
  on public.products for insert
  with check (auth.uid() is not null);

create policy "products: mise à jour par utilisateur authentifié"
  on public.products for update
  using (auth.uid() is not null);

create policy "products: suppression par utilisateur authentifié"
  on public.products for delete
  using (auth.uid() is not null);
