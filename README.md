# DTF Store — Application de vente de transferts DTF

Application web professionnelle de vente de transferts DTF (Direct To Film) avec calculateur de prix dégressifs, upload de fichiers et paiement Stripe.

## Stack technique

- **Framework** : Next.js 16 (App Router)
- **Langage** : TypeScript
- **Styles** : Tailwind CSS 4 — design flat, typographie Suisse
- **Base de données** : SQLite via Prisma ORM 7 + better-sqlite3 adapter
- **Paiement** : Stripe Checkout (API complète + Webhooks)
- **Upload** : react-dropzone (drag & drop PDF/PNG)
- **Icônes** : Lucide React

## Architecture

```
src/
├── app/
│   ├── page.tsx                    # Home — navigation duo (Mètre / Logo)
│   ├── configure/
│   │   ├── metre/page.tsx          # Configurateur DTF au Mètre
│   │   └── logo/page.tsx           # Configurateur DTF au Logo
│   ├── checkout/
│   │   ├── page.tsx                # Panier + formulaire client
│   │   ├── success/page.tsx        # Confirmation de commande
│   │   └── cancel/page.tsx         # Annulation
│   ├── admin/
│   │   ├── layout.tsx              # Layout admin avec sidebar
│   │   ├── page.tsx                # Dashboard (KPIs)
│   │   ├── pricing/page.tsx        # Éditeur de grilles tarifaires
│   │   └── orders/page.tsx         # Gestion des commandes
│   └── api/
│       ├── products/               # CRUD produits
│       ├── tiers/                  # CRUD paliers de prix
│       ├── orders/                 # Gestion commandes
│       ├── checkout/               # Création session Stripe
│       ├── webhook/                # Webhook Stripe
│       ├── upload/                 # Upload fichiers
│       ├── uploads/[filename]/     # Téléchargement fichiers
│       └── seed/                   # Seed base de données
├── components/
│   ├── Header.tsx                  # Navigation principale
│   ├── Footer.tsx                  # Pied de page
│   ├── FileUploader.tsx            # Drag & drop zone
│   ├── PriceTable.tsx              # Grille tarifaire interactive
│   └── StepIndicator.tsx           # Indicateur d'étapes (1-2-3)
├── context/
│   └── CartContext.tsx              # État global du panier
├── lib/
│   ├── prisma.ts                   # Client Prisma singleton
│   ├── stripe.ts                   # Client Stripe
│   ├── pricing.ts                  # Calculateur de prix dégressifs
│   └── types.ts                    # Types TypeScript
└── generated/prisma/               # Client Prisma généré
```

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Générer le client Prisma
npx prisma generate

# 3. Appliquer les migrations
npx prisma migrate dev

# 4. Configurer les variables d'environnement
# Éditer .env avec vos clés Stripe

# 5. Lancer le serveur de développement
npm run dev

# 6. Initialiser les données (produits + tarifs)
# Appeler POST http://localhost:3000/api/seed
```

## Variables d'environnement (.env)

```env
DATABASE_URL="file:./dev.db"

STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_PASSWORD="dtf-admin-2026"
```

## Fonctionnalités

### Côté client
- **Home Page Duo** : deux entrées claires "DTF au Mètre" et "DTF au Logo"
- **Tunnel d'achat en 3 étapes** : Configuration → Upload → Résumé
- **Calculateur de prix dégressif** : affichage temps réel du prix selon quantité
- **Upload drag & drop** : PNG et PDF avec prévisualisation
- **Paiement Stripe Checkout** : redirection sécurisée

### Back-Office (/admin)
- **Dashboard** : KPIs (produits actifs, commandes payées, CA)
- **Gestion des tarifs** : ajout/suppression/modification des paliers de prix par produit — sans toucher au code
- **Gestion des commandes** : liste, statuts (Reçue → En préparation → Expédiée), téléchargement des fichiers clients

### Grille tarifaire par défaut

**DTF au Mètre :**
| Quantité | Prix/m |
|----------|--------|
| 0.5–0.99m | 25 € |
| 1–4.99m | 20 € |
| 5–9.99m | 15 € |
| 10–24.99m | 12 € |
| 25m+ | 10 € |

**DTF au Logo (10×10cm) :**
| Quantité | Prix/pce |
|----------|----------|
| 1–9 | 3,50 € |
| 10–49 | 2,80 € |
| 50–99 | 2,20 € |
| 100–499 | 1,80 € |
| 500+ | 1,40 € |

## Stripe Webhooks

Pour tester les webhooks en local :
```bash
stripe listen --forward-to localhost:3000/api/webhook
```

## License

Propriétaire — Tous droits réservés.
