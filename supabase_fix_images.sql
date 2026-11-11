-- Vide le tableau images pour tous les produits
-- Chaque produit n'aura plus qu'une seule image (le champ image principal)
update public.products set images = '[]'::jsonb;
