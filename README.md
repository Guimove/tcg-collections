# Guimove - TCG Collections

Web application to manage and display TCG card collections with intelligent keep/sell calculation.

**Live demo**: [https://guimove.io](https://guimove.io)

## Supported TCGs

- **Yu-Gi-Oh!** — Full collection with intelligent keep/sell algorithm
- **Dragon Ball Akira V2** — Lucky Cards with quantity management
- **Riftbound** — League of Legends TCG with advanced filters
- **Lorcana** — Disney Lorcana TCG with ink, rarity, and franchise filters
- **Dreamcast** — Sega Dreamcast game collection (disc/manual/box tracking)

## Features

- **Multi-TCG management** — Multiple card games with a unified interface
- **CSV import** — Automatic collection loading from CSV files
- **Intelligent calculation** — Automatically determines which cards to keep/sell with configurable rules (Yu-Gi-Oh!)
- **Quantity management** — "Keep 1, sell the rest" system for Akira, Riftbound, and Lorcana
- **Advanced filters** — Search by name, rarity, language, set, color, type
- **Flexible sorting** — Sort by name, rarity, quantity (ascending/descending)
- **Unified shopping cart** — Select and export cards to CSV across all TCGs
- **Card images** — Automatic image loading (YGOPRODeck API for Yu-Gi-Oh!)
- **Responsive design** — Per-TCG themes, mobile/desktop
- **Code splitting** — Each page is loaded on demand (React.lazy)

## Keep/Sell Logic

### Yu-Gi-Oh! (Intelligent calculation)

For each card:
1. Keep 1 copy per unique combination (set + rarity)
2. Minimum 3 copies or the number of unique versions (whichever is higher)
3. Priority: Rarity > Language > Index

**Example**: A card with 5 different versions → keep 5 copies (max(3, 5)), sell the rest

### Akira, Riftbound & Lorcana (Simple system)

- Keep 1 copy of each card
- List for sale all cards with quantity >= 2
- Display unowned cards (greyed out)

## Installation

```bash
git clone <url>
cd guimove-tcg-collections

npm install

# Development
npm run dev

# Production build
npm run build
```

Dev server at **http://localhost:5173**

## Deployment

### Docker / Kubernetes

```bash
docker-compose up -d --build

# Available at http://localhost:8080
```

**Docker configuration**:
- Multi-stage build (Node 20 Alpine -> Nginx Alpine)
- Optimized final image (~25MB)
- Kubernetes health checks (liveness/readiness)
- Non-root user (nginx:101) for security
- Gzip compression enabled
- Optimized caching (1 year for assets, no-cache for CSV)
- Nginx SPA routing

**Update collections without rebuild**:
```bash
cp new_collection.csv public/yugioh/collection.csv
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
        { value: stats.uniqueOwned, label: 'Owned' },
        { value: stats.totalForSale, label: 'For sale' },
        { value: stats.uniqueForSale, label: 'Unique for sale' },
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

## CSV Formats

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

## Tech Stack

- **React 19** + TypeScript 5.9
- **Vite 7** (build & dev server)
- **React Router 7** (navigation with code splitting)
- **PapaParse** (CSV parsing)
- **YGOPRODeck API** (Yu-Gi-Oh! card images)
- **Nginx** (production web server)
- **Docker** (containerization)
- Deployment: Kubernetes (self-hosted)

## Project Structure

```
src/
├── collectibles.ts              # Collectible registry (routes + homepage auto-generated)
├── shared.css                   # Shared structural CSS (.collection-page)
├── components/
│   ├── CollectionPageLayout.tsx  # Shared layout (header, stats, cart, loading/error)
│   ├── CollectionHeader.tsx      # Header with stats
│   ├── CardModal.tsx             # Generic modal (overlay + ESC close)
│   ├── CardDetailModal.tsx       # Yu-Gi-Oh! card detail modal
│   ├── CartPanel.tsx             # Unified side cart panel
│   ├── EmptyState.tsx            # Empty state display
│   ├── FloatingCartButton.tsx    # Floating cart button
│   ├── ScrollToTopButton.tsx     # Scroll-to-top button
│   └── OptimizedImage.tsx        # Image with WebP/PNG fallback
├── hooks/
│   ├── useCollectionData.ts      # CSV loading (fetch + parse + state)
│   ├── useCart.ts                # Cart management (localStorage)
│   ├── useCardImage.ts           # Yu-Gi-Oh! images (API + cache)
│   ├── useScrollToTop.ts         # Scroll detection + scroll to top
│   └── usePageTitle.ts           # Page title
├── pages/
│   ├── HomePage.tsx              # Homepage (generated from collectibles.ts)
│   ├── AkiraPage.tsx             # Dragon Ball Akira
│   ├── YugiohPage.tsx            # Yu-Gi-Oh!
│   ├── RiftboundPage.tsx         # Riftbound (LoL TCG)
│   ├── LorcanaPage.tsx           # Disney Lorcana
│   └── DreamcastPage.tsx         # Sega Dreamcast
├── utils/
│   ├── filters.ts                # Shared filters, stats, sorting
│   ├── algorithm.ts              # Yu-Gi-Oh! keep/sell logic
│   ├── scoring.ts                # Rarity/language scoring
│   ├── csvParser.ts              # Yu-Gi-Oh! CSV parser
│   ├── cardImages.ts             # Image API + cache
│   └── cart.ts                   # Cart utilities
├── types.ts                      # Shared TypeScript types
├── App.tsx                       # Router (auto-generated routes)
└── main.tsx                      # Entry point
```

## Development

### Yu-Gi-Oh! Debug Mode

Click a card -> "Show debug mode" to see:
- Rarity and language scores
- Detailed keep/sell calculations
- Number of versions per card

### Yu-Gi-Oh! Image Cache

Images are cached in localStorage. In browser console:
```js
clearImageCache()     // Clear all cached images
clearFailedNames()    // Retry failed card lookups
```

## Supported Yu-Gi-Oh! Rarities

38 rarities supported, including:
- **S10K**: Secret 10000 (score: 100)
- **STR**: Starlight Rare (score: 98)
- **G**: Ghost Rare (score: 97)
- **QCR**: Quarter Century Secret Rare (score: 95)
- **UTR**: Ultimate Rare (score: 90)
- **SCR**: Secret Rare (score: 80)
- **U**: Ultra Rare (score: 70)
- **SR**: Super Rare (score: 62)
- **R**: Rare (score: 56)
- **C**: Common (score: 50)

See `src/utils/scoring.ts` for the full list.

## Security

- No backend (100% static client-side)
- No database
- Local CSV files only
- Non-root Docker container (nginx:101)
- Nginx security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- Kubernetes health checks

## Acknowledgments

Thanks to [ScanFlip](https://www.scanflip.fr/fr) and its creator **Doc Seven** for the excellent Yu-Gi-Oh! collection management tool that generates the CSV files used by this application.

## License

MIT
