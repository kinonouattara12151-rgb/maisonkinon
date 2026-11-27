-- ═══════════════════════════════════════════════════════════════
--  MIGRATION : colonnes delivered_at et cancelled_at sur orders
--  + policy UPDATE admin + activation Realtime
-- ═══════════════════════════════════════════════════════════════

-- 1. Colonnes manquantes (idempotent)
alter table public.orders
  add column if not exists delivered_at  timestamptz,
  add column if not exists cancelled_at  timestamptz;

-- 2. Rafraîchir le cache de schéma PostgREST
--    (Supabase Cloud le fait automatiquement dans les secondes qui suivent
--     une migration ; la ligne ci-dessous accélère dans les cas lents)
notify pgrst, 'reload schema';

-- 3. Policy UPDATE admin (tout utilisateur auth peut changer un statut)
drop policy if exists "orders: mise à jour par l'admin" on public.orders;
create policy "orders: mise à jour par l'admin"
  on public.orders for update
  using  (auth.uid() is not null)
  with check (auth.uid() is not null);

-- 4. Realtime sur orders (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname   = 'supabase_realtime'
       and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
