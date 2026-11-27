# MAISON KINON

**Boutique e-commerce multi-catégories — Côte d'Ivoire.**
Parfums, Soins, Maquillage, Mode, Jouets & Divers, avec espace compte client, panier, suivi de commandes et tableau de bord administrateur.

🌐 **Production :** [https://maisonkinon.vercel.app](https://maisonkinon.vercel.app)

---

## Fonctionnalités principales

### Vitrine & Catalogue
- Catégories : **Arrivages & Divers**, Parfums, Soins du visage, Soins du corps, Maquillage, Cheveux, Homme, Marques, Soldes
- Carrousel hero dynamique configurable depuis l'Admin
- Section **Ventes Flash** avec compte à rebours et jauge de stock
- Grille produits responsive : 2 colonnes mobile → 6 colonnes grand écran (style Jumia)
- Filtres multi-critères (genre, famille, marque, prix, concentration)
- Tri (popularité, prix croissant/décroissant, nouveautés)
- Vue grille et vue liste
- Section **Arrivages** avec indicateurs de disponibilité

### Barre de recherche avec autocomplétion
- Suggestions instantanées avec **debounce 160 ms**
- Double niveau : mots-clés / catégories / marques + aperçu produits avec miniature photo
- Prix barré et badge promo dans les suggestions
- Clic sur une suggestion → ouverture directe de la fiche produit
- Navigation clavier complète (↑ ↓ Entrée Échap)

### Fiche produit
- **Galerie multi-photos** avec miniatures, flèches et zoom
- Onglets : Présentation · Conseils d'utilisation · Notes olfactives · Avis clients
- Système d'avis avec notation étoiles et badge « Achat vérifié »
- Suggestions de produits similaires (moteur de similarité cosinus)
- Ajout au panier + favoris

### Panier & Commande
- Tiroir panier latéral avec miniatures et fallback image
- Double mode : **Supabase** si connecté, **localStorage** pour les invités
- Quantités modifiables, suppression article, vider le panier
- Modal de commande : téléphone, ville, commune, date & créneau souhaités, notes
- Paiement à la livraison, Wave, Orange Money, MTN MoMo, Moov Money, Visa/MC

### Compte client & Suivi de commandes
- Inscription / Connexion via **Supabase Auth** (JWT + RLS)
- Réinitialisation de mot de passe par e-mail
- Onglet **Mes commandes** avec filtres : Toutes · En cours · Livrées · Annulées
- **Timeline visuelle 4 étapes** : Commande passée → Confirmée → En livraison → Livrée
- **Annulation en 30 minutes** : compte à rebours affiché, blocage automatique après expiration, lien vers le Centre d'aide
- Statut « Livrée » avec date/heure de livraison
- Boutons **Recommander** (remet les articles au panier) et **Laisser un avis** sur commandes livrées
- Synchronisation temps réel avec l'Admin via **Supabase Realtime** + signal cross-tab localStorage

### Centre d'aide
- Page `/aide` avec 20+ questions/réponses en accordéon
- 6 rubriques : Passer une commande, Paiements, Bons d'achat, Livraison, Retours, Produits
- Barre de recherche FAQ temps réel (cross-rubriques)
- Navigation par hash URL depuis le menu Aide du Header (`/aide#suivre-colis`)
- Bloc d'escalade avec bouton **WhatsApp** (numéro configurable depuis l'Admin)

### Tableau de bord Administrateur (`/admin`)
- Protégé par authentification Supabase (guard de route)
- **Dashboard** : KPIs (CA hors annulées, commandes à traiter, stock faible), 4 graphiques Recharts
- **Alerte commandes annulées** : bandeau rouge dès qu'un client annule dans la dernière heure
- **Produits** : CRUD complet, multi-photos (upload PC ou URL), définition de l'image principale
- **Commandes** : liste complète, changement de statut avec écriture `delivered_at` / `cancelled_at` en base, **résilience fallback** si colonne absente du cache de schéma
- **Vitrine** : configuration du ticker défilant, slides du carrousel, deadlines Ventes Flash
- **Paramètres** : numéro WhatsApp, frais de livraison, e-mail de contact, réseaux sociaux

---

## Stack technique

| Outil | Version | Rôle |
|---|---|---|
| React | 18.3 | UI |
| TypeScript | 5.4 | Typage statique |
| Vite | 5.2 | Bundler / dev server |
| Tailwind CSS | 3.4 | Styles utilitaires |
| React Router | 6.23 | Routing SPA |
| Supabase | 2.118 | Auth + PostgreSQL + Realtime |
| Recharts | 3.10 | Graphiques dashboard Admin |
| lucide-react | 0.344 | Icônes |
| Vitest | 1.6 | Tests unitaires |

---

## Installation

### Prérequis
- **Node.js 18+**
- Un projet **Supabase** (gratuit sur [supabase.com](https://supabase.com))
- **Supabase CLI** (`npm install -g supabase`) pour les migrations

### 1. Cloner et installer

```bash
git clone <url-du-repo>
cd maisonkinon
npm install
```

### 2. Variables d'environnement

Créer un fichier `.env` à la racine :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-publique
```

Ces valeurs se trouvent dans **Supabase Dashboard → Settings → API**.

### 3. Base de données

```bash
# Lier le projet Supabase
supabase link --project-ref votre-project-ref

# Pousser toutes les migrations (tables, RLS, colonnes, Realtime)
supabase db push --remote --yes
```

Ou coller manuellement `supabase_schema.sql` dans le **SQL Editor** de Supabase.

### 4. Lancer en local

```bash
npm run dev       # → http://localhost:5173
```

### 5. Build de production

```bash
npm run build     # Génère dist/
npm run preview   # Prévisualise le build
```

---

## Structure du projet

```
maisonkinon/
├── index.html
├── package.json
├── vite.config.ts
├── supabase_schema.sql          # Schéma SQL complet (reference)
├── supabase/
│   ├── config.toml
│   └── migrations/
│       └── 20261126_add_order_timestamps.sql
├── public/
│   ├── robots.txt
│   └── sitemap.xml
└── src/
    ├── App.tsx                  # Routes + Providers
    ├── index.css                # Variables CSS thème + animations
    ├── types/index.ts           # Types : Product, Order, CartItem, User…
    ├── data/
    │   ├── products.ts          # Catalogue statique (fallback mock)
    │   └── catalog/             # Sous-catalogues par catégorie
    ├── lib/
    │   ├── supabase.ts          # Client Supabase + types DB
    │   ├── chatAgent.ts         # Agent IA local (moteur à règles)
    │   └── currency.ts
    ├── context/
    │   ├── AuthContext.tsx      # Auth + orders + Realtime
    │   ├── ProductsContext.tsx  # Catalogue unifié Supabase + mocks
    │   └── StoreContext.tsx     # Config vitrine (ticker, slides, settings)
    ├── hooks/
    │   ├── useCart.ts
    │   ├── useWishlist.ts
    │   ├── useFilters.ts
    │   ├── useSort.ts
    │   └── useRecommendations.ts
    ├── components/
    │   ├── Header.tsx           # Nav responsive, SearchBar, menu Aide
    │   ├── SearchBar.tsx        # Autocomplétion avec debounce
    │   ├── ProductCard.tsx      # Carte grille + liste
    │   ├── ProductDetailModal.tsx # Galerie multi-photos, avis, suggestions
    │   ├── CartDrawer.tsx       # Tiroir panier
    │   ├── CheckoutModal.tsx    # Formulaire de commande
    │   ├── AccountModal.tsx     # Profil + Mes commandes + Timeline
    │   ├── HeroSlider.tsx
    │   ├── FlashSales.tsx
    │   ├── ArrivagesSection.tsx
    │   ├── AIChatWidget.tsx
    │   ├── Footer.tsx
    │   └── admin/
    │       ├── ProductForm.tsx  # MultiImagePicker + formulaire CRUD
    │       └── ProductTable.tsx
    └── pages/
        ├── ShopPage.tsx         # Boutique principale
        ├── AdminPage.tsx        # Dashboard + CRUD produits + commandes
        ├── HelpPage.tsx         # Centre d'aide (FAQ + WhatsApp)
        ├── LoginPage.tsx
        ├── ResetPasswordPage.tsx
        ├── PrivacyPage.tsx
        ├── TermsPage.tsx
        ├── CookiesPage.tsx
        ├── LegalPage.tsx
        └── NotFoundPage.tsx
```

---

## Routes

| URL | Page | Accès |
|---|---|---|
| `/` | Boutique — catalogue, filtres, recherche | Public |
| `/aide` | Centre d'aide (FAQ + WhatsApp) | Public |
| `/login` | Connexion / Création de compte | Public |
| `/reset-password` | Réinitialisation du mot de passe | Public |
| `/admin` | Dashboard Admin + CRUD + Commandes | **Authentifié** |
| `/confidentialite` | Politique de confidentialité | Public |
| `/cgu` | Conditions générales | Public |
| `/cookies` | Politique des cookies | Public |
| `/mentions-legales` | Mentions légales | Public |

---

## Base de données Supabase

| Table | Contenu |
|---|---|
| `products` | Catalogue (CRUD Admin, lecture publique) |
| `orders` | Commandes (statut, delivered_at, cancelled_at) |
| `order_items` | Articles de chaque commande |
| `cart_items` | Panier utilisateur connecté |
| `wishlist_items` | Favoris utilisateur connecté |
| `profiles` | Profils (créés automatiquement à l'inscription) |

Toutes les tables ont **Row Level Security (RLS)** activée. Chaque utilisateur ne voit que ses propres données.

---

## Déploiement

### Vercel (Frontend)

Le fichier `vercel.json` configure le SPA rewrite. Pour redéployer :

```bash
vercel --prod --yes
```

### Supabase (Migrations)

```bash
supabase db push --remote --yes
```

---

## Tests

```bash
npm run test
```

- `src/lib/chatAgent.test.ts` — tests agent IA (extraction contexte, filtrage, réponses)
- `src/hooks/useRecommendations.test.ts` — tests moteur de similarité

---

## Conformité

- Bandeau de consentement cookies (3 catégories)
- Politique de confidentialité conforme **Loi n°2013-450 (Côte d'Ivoire)** et recommandations **ARTCI**
- Mentions légales avec formulaire de rétractation
- Politique de retour (30 jours)
- `/admin` exclu de l'indexation (`robots.txt`)
- Attributs ARIA, navigation clavier, contrastes WCAG 2.1 AA

---

## Auteur

**Kinon Ouattara** — 2026
