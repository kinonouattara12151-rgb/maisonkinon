# MAISON KINON

Site e-commerce de parfums de prestige — Côte d'Ivoire.  
Catalogue en ligne avec espace compte, panier, agent IA conversationnel et tableau de bord administrateur.

---

## Stack technique

| Outil | Version | Rôle |
|---|---|---|
| React | 18.3 | UI |
| TypeScript | 5.4 | Typage statique |
| Vite | 5.2 | Bundler / dev server |
| Tailwind CSS | 3.4 | Styles utilitaires |
| React Router | 6.23 | Routing côté client |
| Recharts | 3.10 | Graphiques admin |
| Supabase | 2.118 | Backend (Auth + BDD PostgreSQL + Edge Functions) |
| Vitest | 1.6 | Tests unitaires |
| lucide-react | 0.344 | Icônes |

**Data / ML** (notebook Jupyter) : pandas, scikit-learn, matplotlib, joblib.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                │
│                                                          │
│  Boutique  ·  Compte  ·  Panier  ·  Admin  ·  Agent IA    │
│                                                          │
│  ┌─────────────┐    ┌──────────────┐   ┌───────────────┐  │
│  │ useCart     │    │ AuthContext  │   │ AIChatWidget  │  │
│  │ useWishlist │    │ (Supabase    │   │ (sendMessage) │  │
│  │ useFilters  │    │  Auth)       │   │      ↓        │  │
│  │ useReco     │    └──────┬───────┘   │  chatAgentLLM │  │
│  └──────┬──────┘           │           └───────┬───────┘  │
│         │                  │                   │          │
│         │       ┌──────────┴────────────┐      │          │
│         │       │  Supabase Client      │      │          │
│         └──────►│  (auth + DB + RPC)    │◄─────┘          │
│                 └──────────┬────────────┘                 │
└─────────────────────────────┼────────────────────────────┘
                              │
              ┌───────────────┼───────────────────┐
              │          SUPABASE (Cloud)          │
              │                                   │
              │  ┌─────────┐  ┌─────────┐         │
              │  │  Auth   │  │PostgreSQL│        │
              │  │(JWT,RLS)│  │ products │        │
              │  └─────────┘  │ orders   │        │
              │               │ cart     │        │
              │  ┌──────────────────────┐ │        │
              │  │ Edge Function:       │ │        │
              │  │ agent-chat (Deno)    │ │        │
              │  │  → appelle LLM (API) │ │        │
              │  │  → function-calling  │ │        │
              │  │  → 3 outils (catalog,│ │        │
              │  │    détails, commandes)│ │       │
              │  └──────────────────────┘         │
              └───────────────────────────────────┘
```

---

## Installation et démarrage

### Prérequis
- Node.js 18+
- Un projet Supabase (URL + clé anon dans `.env`)
- (Optionnel) Python 3.10+ pour le notebook d'analyse

### Variables d'environnement (`.env`)
```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon
```

### Frontend
```bash
npm install
npm run dev          # Serveur de développement (http://localhost:5173)
npm run build        # Build de production
npm run test         # Tests unitaires (28 tests)
npm run lint         # Lint ESLint
```

### Base de données Supabase
1. Créer un projet sur [supabase.com](https://supabase.com)
2. Renseigner `.env` avec l'URL et la clé anon
3. Exécuter `supabase_schema.sql` dans le SQL Editor (Dashboard Supabase)
   - Crée les tables : `profiles`, `products`, `orders`, `order_items`, `cart_items`, `wishlist_items`
   - Active Row Level Security (RLS) sur toutes les tables
   - Crée les politiques : lecture publique pour les produits, données utilisateur isolées par `auth.uid()`

### Agent IA — Edge Function (optionnel, active le vrai LLM)

Sans l'edge function, l'agent fonctionne en **mode local déterministe** (moteur à règles). Avec l'edge function, il utilise un **vrai LLM avec tool-calling**.

```bash
# Installer la Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier le projet (remplacer l'ID dans supabase/config.toml)
supabase link --project-ref votre-project-id

# Configurer la clé API du LLM (OpenAI ou compatible)
supabase secrets set OPENAI_API_KEY=sk-...

# Optionnel : changer le modèle (défaut: gpt-4o-mini)
supabase secrets set OPENAI_MODEL=gpt-4o-mini

# Déployer la fonction
supabase functions deploy agent-chat
```

L'agent essaie d'abord le LLM, puis retombe automatiquement sur le moteur local si l'edge function n'est pas déployée ou échoue.

---

## Structure du projet

```
maisonkinon/
├── index.html
├── package.json
├── vite.config.ts             # Config Vite + Vitest
├── vercel.json                # Déploiement Vercel (SPA rewrite)
├── supabase_schema.sql        # Schéma SQL complet (tables + RLS)
├── supabase/
│   ├── config.toml            # Config Supabase CLI
│   └── functions/
│       └── agent-chat/
│           └── index.ts       # Edge Function : LLM + tool-calling
├── data_analysis/
│   ├── catalogue.csv          # Source de données (12 produits)
│   └── analyse_catalogue.ipynb  # Notebook : nettoyage, stats, ML, reco
├── public/
│   ├── robots.txt
│   └── sitemap.xml
└── src/
    ├── main.tsx
    ├── App.tsx                # Routeur + AuthProvider + CookieBanner
    ├── index.css             # Variables CSS du thème + Tailwind
    ├── types/index.ts         # Product, CartItem, User, Order, DeliveryInfo
    ├── data/products.ts       # Catalogue statique (12 produits)
    ├── lib/
    │   ├── supabase.ts        # Client Supabase + types Db*
    │   └── chatAgent.ts       # Agent IA : moteur local + appel LLM + outils
    ├── context/AuthContext.tsx  # Auth Supabase (signIn, signUp, orders, reset)
    ├── hooks/
    │   ├── useCart.ts         # Panier (Supabase si connecté, sinon localStorage)
    │   ├── useWishlist.ts     # Favoris (Supabase si connecté, sinon localStorage)
    │   ├── useFilters.ts      # Filtres multi-critères
    │   ├── useSort.ts         # Tri des produits
    │   └── useRecommendations.ts  # Moteur de similarité
    ├── components/
    │   ├── Header.tsx · Footer.tsx · ProductCard.tsx
    │   ├── FilterSection.tsx · SearchBar.tsx
    │   ├── RecommendationSection.tsx
    │   ├── CartDrawer.tsx · CheckoutModal.tsx
    │   ├── ProductDetailModal.tsx
    │   ├── AccountModal.tsx
    │   ├── AIChatWidget.tsx    # Widget chat (async + loading + fallback)
    │   ├── CookieBanner.tsx
    │   └── admin/
    │       ├── ProductForm.tsx
    │       └── ProductTable.tsx
    ├── pages/
    │   ├── ShopPage.tsx · LoginPage.tsx · AdminPage.tsx
    │   ├── ResetPasswordPage.tsx
    │   └── PrivacyPage · TermsPage · CookiesPage · LegalPage
    └── tests
        ├── lib/chatAgent.test.ts        # 21 tests (contexte, filtrage, réponses)
        └── hooks/useRecommendations.test.ts  # 7 tests (similarité)
```

---

## Routes

| URL | Page | Accès |
|---|---|---|
| `/` | Boutique — catalogue, filtres, recherche | Public |
| `/login` | Connexion / Création de compte | Public |
| `/reset-password` | Réinitialisation du mot de passe | Public |
| `/admin` | Dashboard analytique + gestion catalogue + commandes | **Authentifié** (guard d'auth) |
| `/confidentialite` | Politique de confidentialité | Public |
| `/cgu` | Conditions générales | Public |
| `/cookies` | Politique des cookies | Public |
| `/mentions-legales` | Mentions légales et remboursements | Public |

La route `/admin` est protégée par un guard d'authentification : les utilisateurs non connectés sont redirigés vers `/login`.

---

## Fonctionnalités

### Boutique
- Catalogue de 12 parfums avec filtres (genre, famille olfactive, marque, prix, concentration)
- Recherche textuelle en temps réel avec autocomplete (flèches du clavier)
- Tri par prix croissant / décroissant / nouveautés
- Vue grille ou liste
- Section "Vous pourriez aussi aimer" (moteur de similarité pondéré)

### Compte utilisateur (Supabase Auth)
- Inscription avec consentement à la politique de confidentialité
- Connexion / déconnexion via Supabase Auth (bcrypt côté serveur)
- Réinitialisation du mot de passe par e-mail
- Espace personnel : profil et historique des commandes
- Les données utilisateur sont isolées par Row Level Security (RLS)

### Panier & Favoris (double mode)
- **Connecté** : persistance dans Supabase (`cart_items`, `wishlist_items`)
- **Invité** : persistance dans `localStorage` (fallback)
- Ajout, modification des quantités, suppression
- Validation de commande avec informations de livraison (téléphone, commune, créneau)

### Agent IA conversationnel
- Widget de chat flottant en bas à droite
- **Mode LLM** (si l'edge function est déployée) : vrai agent IA avec tool-calling
  - Le LLM décide lui-même quels outils appeler selon la conversation
  - Outil `search_catalog` : filtre le catalogue par critères
  - Outil `get_product_details` : détails complets d'un parfum (notes, tenue, sillage)
  - Outil `get_user_orders` : historique des commandes du client (si connecté)
  - La clé API reste côté serveur (Supabase secret), jamais exposée au client
- **Mode local** (fallback) : moteur déterministe à règles avec mémoire conversationnelle
  - Accumule les critères au fil de la conversation (budget, genre, famille, marque)
  - Relaxation progressive des contraintes quand aucun résultat ne correspond
  - Gestion du small talk, hors-sujet, et empathie pour les contraintes budgétaires

### Dashboard admin (`/admin`) — protégé par auth
- **Onglet Analytics** : KPIs catalogue, 8 graphiques Recharts (familles, genres, prix, concentrations)
- **Onglet Produits** : CRUD complet — ajout, édition, suppression persistance Supabase
  - Upload d'image depuis le disque (base64) ou par URL
- **Onglet Commandes** : liste des commandes reçues, statuts modifiables, infos de livraison

---

## Données et stockage

### Backend — Supabase (PostgreSQL + RLS)

| Table | Contenu | Accès |
|---|---|---|
| `profiles` | Profils utilisateurs (auto-créés via trigger à l'inscription) | Propriétaire uniquement |
| `products` | Catalogue de parfums (CRUD admin) | Lecture publique, écriture authentifiée |
| `orders` | Commandes (total, statut, infos livraison) | Propriétaire uniquement |
| `order_items` | Articles de chaque commande | Propriétaire uniquement |
| `cart_items` | Panier des utilisateurs connectés | Propriétaire uniquement |
| `wishlist_items` | Favoris des utilisateurs connectés | Propriétaire uniquement |

Toutes les tables ont **Row Level Security** activée. Chaque utilisateur ne voit que ses propres données (`auth.uid() = user_id`). Les produits sont lisibles par tous (catalogue public).

### Stockage local (invités)
Quand l'utilisateur n'est pas connecté, le panier et les favoris sont stockés dans `localStorage` :
- `kinon_cart_guest` — panier invité
- `kinon_wishlist_guest` — favoris invité
- `kinon_consent` — préférences de consentement

---

## Analyse de données & Machine Learning

Le notebook `data_analysis/analyse_catalogue.ipynb` contient l'analyse complète :

1. **Collecte** : lecture automatisée depuis `catalogue.csv`
2. **Nettoyage** : traitement des valeurs manquantes, feature engineering (`discount_pct`, `is_promo`, `price_per_ml`), export vers `catalogue_nettoye.csv`
3. **Analyse** : statistiques descriptives, `groupby`, tableaux croisés
4. **Visualisation** : 4 graphiques matplotlib (familles, prix, genres, moyennes)
5. **Machine Learning** :
   - **Clustering K-Means** (non supervisé) : segmentation des parfums, évaluée par score de silhouette
   - **Classification** (supervisé) : comparaison Random Forest vs Régression Logistique, validation croisée 5-fold, accuracy / précision / rappel / F1
   - **Recommandation** : similarité cosinus sur 5 features (prix, volume, prix/ml, famille, genre)
6. **Export** : modèles sauvegardés via `joblib` (`modele_genre.pkl`, `modele_kmeans.pkl`)

---

## Tests

```bash
npm run test    # 28 tests unitaires
```

- `src/lib/chatAgent.test.ts` (21 tests) : extraction du contexte, filtrage, génération de réponses, cas limites
- `src/hooks/useRecommendations.test.ts` (7 tests) : fonction de similarité, symétrie, cas limites

---

## Déploiement

### Frontend — Vercel
L'application est déployée et accessible à cette URL :

**https://maisonkinon.vercel.app**

Le fichier `vercel.json` configure le déploiement (SPA rewrite, build Vite).  
Pour redéployer après une modification : `vercel --prod --yes`

### Backend — Supabase
La base de données et l'authentification sont hébergées sur Supabase Cloud. L'edge function `agent-chat` est déployée via la Supabase CLI (voir ci-dessus).

---

## Conformité légale

Le projet est conforme aux exigences de la **Loi n°2013-450 du 19 juin 2013** relative à la protection des données à caractère personnel (Côte d'Ivoire) et aux recommandations de l'**ARTCI**.

- Bandeau de consentement au stockage local (3 catégories : nécessaire, fonctionnel, analytique)
- Politique de confidentialité avec tableau des traitements et droits des personnes (Art. 29 à 37)
- Mentions légales avec formulaire de rétractation légal
- Politique de remboursement (retour 30 jours gratuit, rétractation 14 jours)
- `/admin` exclus de l'indexation (`robots.txt`)

---

## Accessibilité

- Attributs `alt` descriptifs sur toutes les images
- Rôles ARIA sur les modales, drawers et composants interactifs (`role="dialog"`, `aria-modal`, `aria-label`)
- Navigation au clavier sur tous les éléments interactifs (recherche, galerie, fermeture Escape)
- Ratios de contraste conformes WCAG 2.1 AA (minimum 4.5:1)
- Balisage sémantique HTML5 (`<header>`, `<main>`, `<nav>`, `<aside>`, `<footer>`, `<section>`)

---

## Auteur

**Kinon Ouattara** — 2026
