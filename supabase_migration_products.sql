-- ═══════════════════════════════════════════════════════════════
--  MAISON KINON — Migration : table products
--  Coller dans Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.products (
  id                   integer primary key,
  brand                text not null default '',
  name                 text not null,
  volume               text not null default '',
  price                numeric(10,2) not null default 0,
  original_price       numeric(10,2),
  image                text not null default '',
  images               jsonb default '[]'::jsonb,
  badge                text,
  gender               text not null default 'Unisexe',
  family               text not null default '',
  origine              text default '',
  conseils_utilisation text default '',
  tenue                text default '',
  effet_sillage        text default '',
  notes                jsonb default '{}'::jsonb,
  description          text default '',
  created_at           timestamptz default now()
);

alter table public.products enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'products' and policyname = 'products: lecture publique'
  ) then
    create policy "products: lecture publique"
      on public.products for select using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'products' and policyname = 'products: creation auth'
  ) then
    create policy "products: creation auth"
      on public.products for insert with check (auth.uid() is not null);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'products' and policyname = 'products: maj auth'
  ) then
    create policy "products: maj auth"
      on public.products for update using (auth.uid() is not null);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'products' and policyname = 'products: suppression auth'
  ) then
    create policy "products: suppression auth"
      on public.products for delete using (auth.uid() is not null);
  end if;
end $$;
