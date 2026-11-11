-- Conversion des prix EUR → FCFA (taux fixe : 1 € = 655.957 XOF)
-- Arrondi à la centaine la plus proche
update public.products
set
  price          = round(price * 655.957 / 100) * 100,
  original_price = case
    when original_price is not null
    then round(original_price * 655.957 / 100) * 100
    else null
  end;
