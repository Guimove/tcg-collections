# Guimove - Collections TCG

Application web pour gérer et afficher des collections de cartes TCG avec système de calcul intelligent des cartes à vendre.

**Démo en ligne** : [https://guimove.io](https://guimove.io)

## TCG Supportés

- **Yu-Gi-Oh!** : Collection complète avec calcul intelligent des cartes à garder/vendre
- **Dragon Ball Akira V2** : Lucky Cards avec gestion des quantités
- **Riftbound** : League of Legends TCG avec filtres avancés

## Fonctionnalités

- **Gestion multi-TCG** : Support de plusieurs jeux de cartes avec interface unifiée
- **Import CSV** : Chargement automatique de vos collections depuis fichiers CSV
- **Calcul intelligent** : Détermine automatiquement les cartes à garder/vendre selon des règles personnalisables (Yu-Gi-Oh!)
- **Gestion des quantités** : Système "garde 1, vends le reste" pour Akira et Riftbound
- **Filtres avancés** : Recherche par nom, rareté, langue, extension, couleur, type
- **Tri flexible** : Tri par nom, rareté, quantité (croissant/décroissant)
- **Panier d'achat unifié** : Sélection et export CSV des cartes de tous les TCG
- **Images de cartes** : Chargement automatique des images (YGOPRODeck API pour Yu-Gi-Oh!)
- **Interface responsive** : Thèmes adaptés à chaque TCG, mobile/desktop

## Logiques de calcul

### Yu-Gi-Oh! (Calcul intelligent)

Pour chaque carte :
1. Garde 1 copie par combinaison unique (extension + rareté)
2. Minimum 3 copies ou le nombre de versions uniques (le plus élevé)
3. Priorité : Rareté > Langue > Index

**Exemple** : Une carte avec 5 versions différentes → garde 5 copies (max(3, 5)), vend le reste

### Akira & Riftbound (Système simple)

- Garde 1 exemplaire de chaque carte
- Met en vente toutes les cartes avec quantité ≥ 2
- Affichage des cartes non possédées (grises)

## Installation

```bash
# Cloner le projet
git clone <url>
cd guimove-tcg-collections

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build production
npm run build
```

Site accessible sur **http://localhost:5173**

## Déploiement

### Docker / Kubernetes

```bash
# Build et lancer avec Docker Compose
docker-compose up -d --build

# Accessible sur http://localhost:8080
```

**Configuration Docker** :
- Multi-stage build (Node 20 Alpine → Nginx Alpine)
- Image finale optimisée (~25MB)
- Health checks pour Kubernetes (liveness/readiness)
- User non-root (nginx:101) pour la sécurité
- Compression Gzip activée
- Cache optimisé (1 an pour assets, pas de cache pour CSV)
- Configuration Nginx avec SPA routing

**Mettre à jour les collections sans rebuild** :
```bash
# Copier les nouveaux fichiers CSV
cp nouveau_fichier.csv public/yugioh/collection.csv
cp nouveau_fichier.csv public/akira/collection.csv
cp nouveau_fichier.csv public/riftbound/collection.csv

# Redémarrer le container
docker-compose restart
```

**Build de l'image Docker** :
```bash
docker build -t tcg-collections:latest .
```

## Format CSV

### Yu-Gi-Oh! (`public/yugioh/collection.csv`)

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

### Akira (`public/akira/collection.csv`)

```csv
Categorie,Numero,Filename,Quantité
```

### Riftbound (`public/riftbound/collection.csv`)

```csv
Card ID,Card Name,Card Type,Version,Set,Rarity,Quantity,Color,Illustrator,Cost,Might,Effect,Subtype,Image Filename,Card Order,Subtype2
```

## Stack technique

- **React 19** + TypeScript
- **Vite 7** (build & dev server)
- **React Router 7** (navigation multi-pages)
- **PapaParse** (parsing CSV)
- **YGOPRODeck API** (images de cartes Yu-Gi-Oh!)
- **Nginx** (serveur web production)
- **Docker** (containerisation)
- Déploiement : Kubernetes (self-hosted)

## Structure du projet

```
guimove-tcg-collections/
├── src/
│   ├── components/
│   │   ├── CardDetailModal.tsx    # Modal détails carte Yu-Gi-Oh!
│   │   └── CartPanel.tsx          # Panier unifié multi-TCG
│   ├── hooks/
│   │   ├── useCardImage.ts        # Hook images Yu-Gi-Oh!
│   │   └── useCart.ts             # Hook gestion panier
│   ├── pages/
│   │   ├── HomePage.tsx           # Page d'accueil
│   │   ├── YugiohPage.tsx         # Collection Yu-Gi-Oh!
│   │   ├── AkiraPage.tsx          # Collection Akira
│   │   └── RiftboundPage.tsx      # Collection Riftbound
│   ├── utils/
│   │   ├── algorithm.ts           # Logique keep/sell Yu-Gi-Oh!
│   │   ├── scoring.ts             # Scores rareté/langue
│   │   ├── csvParser.ts           # Parser CSV
│   │   ├── cardImages.ts          # API images + cache
│   │   └── cart.ts                # Utilitaires panier
│   ├── App.tsx                    # Router principal
│   ├── types.ts                   # Types TypeScript
│   └── main.tsx                   # Entry point
├── public/
│   ├── yugioh/
│   │   ├── collection.csv         # Yu-Gi-Oh! collection
│   │   └── cards/                 # Images cartes Yu-Gi-Oh!
│   ├── akira/
│   │   ├── collection.csv         # Akira collection
│   │   └── cards/                 # Images cartes Akira
│   ├── riftbound/
│   │   ├── collection.csv         # Riftbound collection
│   │   └── cards/                 # Images cartes Riftbound
│   └── images/                    # Logos et favicons
├── Dockerfile                     # Build Docker multi-stage
├── docker-compose.yml             # Orchestration Docker
└── nginx.conf                     # Config Nginx avec SPA routing
```

## Développement

### Mode debug Yu-Gi-Oh!

Cliquer sur une carte → "Afficher mode debug" pour voir :
- Scores de rareté et langue
- Calculs keep/sell détaillés
- Nombre de versions par carte

### Cache d'images Yu-Gi-Oh!

Les images sont mises en cache dans localStorage. En console :
```js
clearImageCache()     // Vider tout le cache
clearFailedNames()    // Réessayer les cartes échouées
```

## Raretés Yu-Gi-Oh! supportées

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
- CSV locaux uniquement
- Container Docker non-root (user nginx:101)
- Headers de sécurité Nginx (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- Health checks pour Kubernetes

## Remerciements

Un grand merci à [ScanFlip](https://www.scanflip.fr/fr) et son créateur **Doc Seven** pour l'excellent outil de gestion de collection Yu-Gi-Oh! qui permet de générer facilement le fichier CSV utilisé par cette application.

## Licence

MIT
