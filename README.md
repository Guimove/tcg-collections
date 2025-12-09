# Yu-Gi-Oh! Marketplace

Application web pour gérer et afficher une collection de cartes Yu-Gi-Oh! avec système de calcul intelligent des cartes à vendre.

**Démo en ligne** : [https://guimove.io](https://guimove.io)

## Fonctionnalités

- **Import CSV** : Chargement automatique de votre collection depuis un fichier CSV
- **Calcul intelligent** : Détermine automatiquement les cartes à garder/vendre selon des règles personnalisables
- **Filtres avancés** : Recherche par nom, rareté, langue, extension
- **Tri flexible** : Tri par nom, rareté, quantité (croissant/décroissant)
- **Panier d'achat** : Sélection et export CSV des cartes choisies
- **Images de cartes** : Chargement automatique des images via l'API YGOPRODeck
- **Interface responsive** : Thème sombre Yu-Gi-Oh! adapté mobile/desktop

## Logique de calcul

Pour chaque carte :
1. Garde 1 copie par combinaison unique (extension + rareté)
2. Minimum 3 copies ou le nombre de versions uniques (le plus élevé)
3. Priorité : Rareté > Langue > Index

**Exemple** : Une carte avec 5 versions différentes → garde 5 copies (max(3, 5)), vend le reste

## Installation

```bash
# Cloner le projet
git clone <url>
cd yugiho_seler

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build production
npm run build
```

Site accessible sur **http://localhost:5173**

## Déploiement

### Option 1 : Netlify (Recommandé)

```bash
npm run build
netlify deploy --prod --dir=dist
```

Ou drag & drop du dossier `dist/` sur [netlify.com](https://netlify.com)

L'edge function `/api/card-image` est configurée pour proxy les images (évite les problèmes CORS).

### Option 2 : Docker

```bash
# Build et lancer
docker-compose up -d --build

# Accessible sur http://localhost:8080
```

**Configuration Docker** :
- Multi-stage build (Node 20 Alpine → Nginx Alpine)
- Image finale : ~25MB
- Compression Gzip activée
- Cache optimisé (1 an pour assets, pas de cache pour CSV)

**Mettre à jour le CSV sans rebuild** :
```bash
cp nouveau_fichier.csv public/collection.csv
docker-compose restart
```

## Format CSV

Le fichier `public/collection.csv` doit contenir ces colonnes :

```csv
Langue,Extension,Code,Nom de la carte,Rareté,1st Edition,Unlimited,Limited / Autre,Quantité,N° Artwork,Reprint
```

**Colonnes importantes** :
- `Nom de la carte` : Nom français
- `Extension` : Code du set (ex: DDK, LDD, RA04)
- `Code` : Code complet (ex: DDK-F001, RA04-FR101)
- `Rareté` : Code de rareté (SR, U, C, SCR, etc.)
- `Langue` : Français (France), Français (Canada), Anglais (Europe), etc.
- `Quantité` : Nombre de copies possédées

## Stack technique

- **React 19** + TypeScript
- **Vite 7** (build & dev server)
- **PapaParse** (parsing CSV)
- **YGOPRODeck API** (images de cartes)
- Déploiement : Netlify (edge functions) ou Docker (Nginx)

## Structure du projet

```
yugiho_seler/
├── src/
│   ├── components/
│   │   ├── CardDetailModal.tsx    # Modal détails carte + debug
│   │   └── CartPanel.tsx          # Panneau panier latéral
│   ├── hooks/
│   │   ├── useCardImage.ts        # Hook images de cartes
│   │   └── useCart.ts             # Hook gestion panier
│   ├── utils/
│   │   ├── algorithm.ts           # Logique keep/sell
│   │   ├── scoring.ts             # Scores rareté/langue
│   │   ├── csvParser.ts           # Parser CSV
│   │   ├── cardImages.ts          # API images + cache
│   │   └── cart.ts                # Utilitaires panier
│   ├── App.tsx                    # Composant principal
│   ├── App.css                    # Styles & thème
│   ├── types.ts                   # Types TypeScript
│   └── main.tsx                   # Entry point
├── public/
│   └── collection.csv             # Données collection
├── netlify/
│   └── edge-functions/
│       └── card-image.ts          # Proxy images Netlify
├── Dockerfile                     # Build Docker multi-stage
├── docker-compose.yml             # Orchestration Docker
├── nginx.conf                     # Config Nginx
└── netlify.toml                   # Config Netlify
```

## Développement

**Mode debug** : Cliquer sur une carte → "Afficher mode debug" pour voir :
- Scores de rareté et langue
- Calculs keep/sell détaillés
- Nombre de versions par carte

**Cache d'images** : Les images sont mises en cache dans localStorage. En console :
```js
clearImageCache()     // Vider tout le cache
clearFailedNames()    // Réessayer les cartes échouées
```

## Raretés supportées

38 raretés supportées, incluant :
- **S10K** : Secrète 10000 (score: 100)
- **STR** : Starlight Rare (score: 98)
- **G** : Ghost Rare (score: 97)
- **QCR** : Secrète Rare Quart de Siècle (score: 95)
- **UTR** : Ultimate Rare (score: 90)
- **SCR** : Secrète Rare (score: 80)
- **U** : Ultra Rare (score: 70)
- **SR** : Super Rare (score: 62)
- **R** : Rare (score: 56)
- **C** : Commune (score: 50)

Voir `src/utils/scoring.ts` pour la liste complète.

## Sécurité

- Pas de backend (site 100% statique client-side)
- Pas de base de données
- CSV local uniquement
- Headers de sécurité Nginx (si Docker)
- Proxy Netlify pour images (évite exposition API directe)

## Remerciements

Un grand merci à [ScanFlip](https://www.scanflip.fr/fr) et son créateur **Doc Seven** pour l'excellent outil de gestion de collection Yu-Gi-Oh! qui permet de générer facilement le fichier CSV utilisé par cette application.

## Licence

MIT
