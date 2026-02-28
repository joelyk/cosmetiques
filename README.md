# Josy Cosmetics

Base `Next.js` pour une boutique cosmetique extensible: parfums au lancement, puis gels douche, laits corporels, coffrets et autres categories sans changer l'architecture.

Site realise par `GeniusClassrooms`.

## Ce qui est en place

- Homepage, catalogue, fiche produit, panier et checkout WhatsApp.
- Zoom, dezoom, rotation et vues multiples sur les produits.
- Connexion Google via `Auth.js`.
- Deux roles admin: `super_admin` et `admin`.
- Dashboard admin avec courbes trafic / clics / demandes checkout.
- Gestion produit extensible par categorie.
- Gestion des codes promo.
- Studio image admin: compression et suppression simple des fonds unis.
- Fallback local si Supabase n'est pas encore configure.

## Architecture recommandee

GitHub sert au code source. Pour l'hebergement du site, la solution simple et gratuite au depart est:

1. GitHub pour le depot
2. Vercel pour le deploiement automatique
3. Google Auth pour la connexion
4. Supabase gratuit pour le catalogue partage et les analytics

GitHub Pages n'est pas adapte ici, car `Auth.js`, les routes API et la redirection WhatsApp securisee demandent un runtime serveur.

## Authentification simple et gratuite

La solution retenue est `Google Auth`.

Pourquoi:

- pas de mot de passe client a stocker
- simple pour les visiteurs
- simple pour les deux admins
- gratuit au demarrage

Les roles sont pilotes par email:

- `SUPER_ADMIN_EMAILS`
- `ADMIN_EMAILS`

## Flux de paiement WhatsApp

Le client:

1. consulte les produits
2. ajoute au panier
3. remplit ses infos de commande
4. choisit `Mobile Money` ou `Orange Money`
5. clique sur le bouton WhatsApp

Le site:

1. revalide le panier cote serveur
2. reconstruit le message cote serveur
3. injecte le numero officiel depuis `WHATSAPP_ORDER_NUMBER`
4. journalise la demande checkout dans Supabase si disponible

Cela evite qu'un simple script front remplace le numero officiel par un autre numero.

Limite importante: si le terminal ou le navigateur du client est deja compromis, aucun site ne peut garantir a 100% le comportement final sur sa machine. Ici, la partie controllable par le site est bien protegee cote serveur.

## Catalogue partage entre les deux admins

Le site fonctionne en deux modes:

- mode local: les donnees viennent de `src/data/catalog.ts`
- mode partage: les donnees viennent de Supabase

Si Supabase est configure mais vide, l'admin voit encore les donnees locales. Le `super_admin` peut alors initialiser une seule fois le catalogue partage depuis l'interface admin.

## Etapes de mise en place

### 1. Installer et lancer le projet

```bash
npm install
npm run dev
```

### 2. Creer `.env.local`

Copie `.env.example` et renseigne:

```bash
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
SUPER_ADMIN_EMAILS=toi@example.com
ADMIN_EMAILS=autre-admin@example.com
WHATSAPP_ORDER_NUMBER=237600000000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 3. Creer le projet Supabase

1. cree un projet Supabase
2. ouvre l'editeur SQL
3. execute le schema dans [supabase/schema.sql](/c:/Users/joelyk/Documents/Dev/DevWeb/ArtemisteCosmetique/supabase/schema.sql)

### 4. Configurer Google Auth

1. cree un OAuth Client Google
2. ajoute l'URL de callback `https://<ton-domaine>/api/auth/callback/google`
3. renseigne `AUTH_GOOGLE_ID` et `AUTH_GOOGLE_SECRET`

### 5. Initialiser le catalogue partage

1. connecte-toi avec le compte `super_admin`
2. ouvre `/admin`
3. clique sur `Initialiser Supabase`
4. recharge la page

Le site basculera ensuite sur le catalogue partage.

### 6. Deployer

1. pousse sur GitHub
2. connecte le repo a Vercel
3. copie les variables d'environnement dans Vercel
4. redeploie

## Ce que peut faire chaque admin

### Super admin

- connecter et configurer le projet
- initialiser le catalogue partage
- voir la sante globale du site
- suivre les visiteurs entrants

### Second admin

- modifier les produits
- changer les categories produit
- ajuster les visuels
- creer des codes promo
- suivre les clics produit et les demandes checkout

## Image studio

Le studio image integre:

- compresse les images
- retire correctement les fonds unis

Limite:

- pour retirer un enfant ou un decor complexe, il faudra brancher plus tard un service IA specialise

## Structure actuelle

- `src/data/catalog.ts`: catalogue local de depart
- `src/lib/catalog-server.ts`: lecture catalogue live ou fallback local
- `src/app/api/admin/catalog/*`: ecriture admin securisee cote serveur
- `src/app/api/checkout/whatsapp/route.ts`: message WhatsApp reconstruit cote serveur
- `src/components/admin/*`: dashboard, edition produits, promos, image studio
- `supabase/schema.sql`: tables et policies

## Suite logique

1. Brancher les vraies images produit
2. Connecter le vrai numero WhatsApp officiel
3. Ouvrir les premiers comptes admin Google
4. Observer les courbes et ajuster les offres depuis `/admin`
