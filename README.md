# Guimove - Collections TCG

Application web pour gérer et afficher des collections de cartes TCG avec système de calcul intelligent des cartes à vendre.

**Démo en ligne** : [https://guimove.io](https://guimove.io)

## TCG Supportés

- **Yu-Gi-Oh!** : Collection complète avec calcul intelligent des cartes à garder/vendre
- **Dragon Ball Akira V2** : Lucky Cards avec gestion des quantités
- **Riftbound** : League of Legends TCG avec filtres avancés
- **Lorcana** : Disney Lorcana TCG avec filtres par encre, rareté, franchise
- **Dreamcast** : Collection de jeux Sega Dreamcast (disque/notice/boîte)

## Fonctionnalités

- **Gestion multi-TCG** : Support de plusieurs jeux de cartes avec interface unifiée
- **Import CSV** : Chargement automatique de vos collections depuis fichiers CSV
- **Calcul intelligent** : Détermine automatiquement les cartes à garder/vendre selon des règles personnalisables (Yu-Gi-Oh!)
- **Gestion des quantités** : Système "garde 1, vends le reste" pour Akira, Riftbound et Lorcana
- **Filtres avancés** : Recherche par nom, rareté, langue, extension, couleur, type
- **Tri flexible** : Tri par nom, rareté, quantité (croissant/décroissant)
- **Panier d'achat unifié** : Sélection et export CSV des cartes de tous les TCG
- **Images de cartes** : Chargement automatique des images (YGOPRODeck API pour Yu-Gi-Oh!)
- **Interface responsive** : Thèmes adaptés à chaque TCG, mobile/desktop
- **Code splitting** : Chaque page est chargée à la demande (React.lazy)

## Logiques de calcul

### Yu-Gi-Oh! (Calcul intelligent)

Pour chaque carte :
1. Garde 1 copie par combinaison unique (extension + rareté)
2. Minimum 3 copies ou le nombre de versions uniques (le plus élevé)
3. Priorité : Rareté > Langue > Index

**Exemple** : Une carte avec 5 versions différentes → garde 5 copies (max(3, 5)), vend le reste

### Akira, Riftbound & Lorcana (Système simple)

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

# Redémarrer le container
docker-compose restart
```

## Adding a new collectible

Adding a new TCG or collection is a repeatable 5-step workflow.

### 1. Prepare data

```
public/<slug>/collection.csv    # Your collection CSV
public/<slug>/cards/            # Card images (optional)
public/images/<slug>-logo.png   # Logo for homepage
```

### 2. Register in the collectible registry

Edit `src/collectibles.ts` — add one entry to the `collectibles` array:

```typescript
{
  slug: 'mytcg',
  name: 'My TCG',
  logo: '/images/mytcg-logo.png',
  logoAlt: 'My TCG Logo',
  page: lazy(() => import('./pages/MyTcgPage')),
},
```

This auto-generates the route and homepage card. No changes needed in `App.tsx` or `HomePage.tsx`.

### 3. Create the page component

Create `src/pages/MyTcgPage.tsx`. Copy `AkiraPage.tsx` as a starting template. You only write:

- **Card interface** — the fields in your CSV
- **`parseRows` function** — maps CSV rows to your card type
- **Filter controls** — which filters the page shows
- **Card rendering** — grid card layout and modal content

Everything else is provided by `CollectionPageLayout` (header, stats, loading/error states, scroll-to-top, cart panel) and `useCollectionData` (CSV fetching and parsing).

```tsx
import CollectionPageLayout from '../components/CollectionPageLayout';
import { useCollectionData } from '../hooks/useCollectionData';
import { computeSimpleStats } from '../utils/filters';

export default function MyTcgPage() {
  const { data, loading, error } = useCollectionData('/mytcg/collection.csv', parseRows);
  const stats = computeSimpleStats(data);

  return (
    <CollectionPageLayout
      pageTitle="My TCG - Guimove"
      title="My TCG Collection"
      subtitle={`${data.length} cards`}
      cssClass="mytcg-page"
      loading={loading} error={error}
      stats={[
        { value: stats.totalCards, label: 'Total' },
        { value: stats.uniqueOwned, label: 'Uniques' },
        { value: stats.totalForSale, label: 'À vendre' },
        { value: stats.uniqueForSale, label: 'Uniques à vendre' },
      ]}
      hasCart={true}
    >
      {({ cart, openCart }) => (
        <>
          {/* Your filters, card grid, and modal here */}
        </>
      )}
    </CollectionPageLayout>
  );
}
```

Set `hasCart={false}` for collections without sell functionality (e.g. Dreamcast).

### 4. Create page CSS

Create `src/pages/MyTcgPage.css` — define CSS variables for your theme colors and card-specific styles. Structural CSS (header, modal, cart, buttons) is inherited from `src/shared.css` via the `.collection-page` class.

### 5. Docker volume (optional)

Add to `docker-compose.yml` for CSV updates without rebuild:

```yaml
- ./public/mytcg:/usr/share/nginx/html/mytcg:ro
```

## Format CSV

### Yu-Gi-Oh! (`public/yugioh/collection.csv`)

```csv
Langue,Extension,Code,Nom de la carte,Rareté,1st Edition,Unlimited,Limited / Autre,Quantité,N° Artwork,Reprint
```

### Akira (`public/akira/collection.csv`)

```csv
Categorie,Numero,Filename,Quantité
```

### Riftbound (`public/riftbound/collection.csv`)

```csv
card-id,name,type,set,rarity,quantity,color,cost,might,effect,sub-type
```

### Lorcana (`public/lorcana/collection.csv`)

```csv
SET,#,COST,NAME,TYPE,INK,RARITY,STR,WILL,LORE,MOVE COST,CLASSIFICATIONS,ABILITY,FRANCHISE,FLAVOR TEXT,ILLUSTRATORS,QUANTITY
```

### Dreamcast (`public/dreamcast/collection.csv`)

```csv
name;region;serial;disc;manual;box
```

Delimiter: semicolon. `disc`, `manual`, `box` are `1` (owned) or `0` (not owned).

## Stack technique

- **React 19** + TypeScript 5.9
- **Vite 7** (build & dev server)
- **React Router 7** (navigation avec code splitting)
- **PapaParse** (parsing CSV)
- **YGOPRODeck API** (images de cartes Yu-Gi-Oh!)
- **Nginx** (serveur web production)
- **Docker** (containerisation)
- Déploiement : Kubernetes (self-hosted)

## Structure du projet

```
src/
├── collectibles.ts              # Registre des collections (routes + homepage auto-générés)
├── shared.css                   # CSS structurel partagé (.collection-page)
├── components/
│   ├── CollectionPageLayout.tsx  # Layout partagé (header, stats, cart, loading/error)
│   ├── CollectionHeader.tsx      # En-tête avec stats
│   ├── CardModal.tsx             # Modal générique (overlay + ESC)
│   ├── CardDetailModal.tsx       # Modal détails carte Yu-Gi-Oh!
│   ├── CartPanel.tsx             # Panier latéral unifié
│   ├── EmptyState.tsx            # État vide
│   ├── FloatingCartButton.tsx    # Bouton panier flottant
│   ├── ScrollToTopButton.tsx     # Bouton retour en haut
│   └── OptimizedImage.tsx        # Image avec fallback WebP/PNG
├── hooks/
│   ├── useCollectionData.ts      # Chargement CSV (fetch + parse + état)
│   ├── useCart.ts                # Gestion panier (localStorage)
│   ├── useCardImage.ts           # Images Yu-Gi-Oh! (API + cache)
│   ├── useScrollToTop.ts         # Détection scroll + retour en haut
│   └── usePageTitle.ts           # Titre de page
├── pages/
│   ├── HomePage.tsx              # Page d'accueil (généré depuis collectibles.ts)
│   ├── AkiraPage.tsx             # Dragon Ball Akira
│   ├── YugiohPage.tsx            # Yu-Gi-Oh!
│   ├── RiftboundPage.tsx         # Riftbound (LoL TCG)
│   ├── LorcanaPage.tsx           # Disney Lorcana
│   └── DreamcastPage.tsx         # Sega Dreamcast
├── utils/
│   ├── filters.ts                # Filtres, stats, tri partagés
│   ├── algorithm.ts              # Logique keep/sell Yu-Gi-Oh!
│   ├── scoring.ts                # Scores rareté/langue
│   ├── csvParser.ts              # Parser CSV Yu-Gi-Oh!
│   ├── cardImages.ts             # API images + cache
│   └── cart.ts                   # Utilitaires panier
├── types.ts                      # Types TypeScript partagés
├── App.tsx                       # Router (routes auto-générées)
└── main.tsx                      # Entry point
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
