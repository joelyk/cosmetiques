# Josy Cosmetics

Boutique `Next.js` extensible pour parfums, gels douche, laits corporels, coffrets et futures categories.

Site realise par `GeniusClassrooms`.

## Ce qui est en place

- Homepage, catalogue, fiche produit, panier et checkout WhatsApp.
- Connexion par email avec lien magique via Supabase Auth.
- Deux roles admin par liste d'emails: `super_admin` et `admin`.
- Dashboard admin avec analytics simples.
- Edition produits, categories et promotions.
- Studio image admin pour compression et nettoyage simple du fond.
- Fallback local si le catalogue partage Supabase n'est pas encore initialise.

## Architecture recommandee

1. GitHub pour le code
2. Vercel pour le deploiement
3. Supabase pour l'auth email, le catalogue partage et les analytics

GitHub Pages n'est pas adapte ici, car le projet utilise des routes serveur et un runtime Next.js complet.

## Authentification email

Le projet utilise `Supabase Auth` avec lien magique par email.

Pourquoi:

- pas de mot de passe local a stocker
- simple pour les clients
- pas besoin de Google Auth
- pas besoin d'un service email tiers pour demarrer

Les roles restent pilotes par email:

- `SUPER_ADMIN_EMAILS`
- `ADMIN_EMAILS`

## Variables d'environnement

```bash
SUPER_ADMIN_EMAILS=toi@example.com
ADMIN_EMAILS=autre-admin@example.com
WHATSAPP_ORDER_NUMBER=237600000000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Mise en place

### 1. Installer et lancer

```bash
npm install
npm run dev
```

### 2. Configurer Supabase

1. cree un projet Supabase
2. recupere:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. ouvre `Authentication > URL Configuration`
4. ajoute les redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://ton-domaine.vercel.app/auth/callback`
5. laisse l'auth email active

### 3. Creer `.env.local`

Reprends [`.env.example`](.env.example) et renseigne les vraies valeurs.

### 4. Creer les tables catalogue

1. ouvre l'editeur SQL de Supabase
2. execute [supabase/schema.sql](supabase/schema.sql)

### 5. Initialiser le catalogue partage

1. connecte-toi avec l'email present dans `SUPER_ADMIN_EMAILS`
2. ouvre `/admin`
3. clique `Initialiser Supabase`
4. recharge la page

## Paiement WhatsApp

Le site:

1. revalide le panier cote serveur
2. reconstruit le message cote serveur
3. injecte le numero officiel depuis `WHATSAPP_ORDER_NUMBER`
4. journalise la demande checkout dans Supabase si disponible

Cela evite qu'un simple script front remplace le numero WhatsApp officiel.

## Fichiers utiles

- [src/app/login/page.tsx](src/app/login/page.tsx)
- [src/app/auth/callback/route.ts](src/app/auth/callback/route.ts)
- [src/auth.ts](src/auth.ts)
- [src/lib/supabase-auth-server.ts](src/lib/supabase-auth-server.ts)
- [src/proxy.ts](src/proxy.ts)
- [supabase/schema.sql](supabase/schema.sql)
