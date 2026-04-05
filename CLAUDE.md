# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TCG (Trading Card Game) collection management web app deployed at guimove.io. Manages collections for Yu-Gi-Oh!, Dragon Ball Akira, Riftbound, Lorcana, and Dreamcast with intelligent keep/sell calculations.

## Commands

```bash
npm run dev        # Vite dev server on localhost:5173
npm run build      # TypeScript check + Vite production build
npm run preview    # Preview production build
```

No test framework is configured. No linter is configured. TypeScript strict mode is the primary quality gate (`tsc` runs as part of `build`).

Docker deployment: `docker-compose up -d --build` (serves on localhost:8080 via Nginx).

## Architecture

**React 19 + TypeScript + Vite SPA** with React Router and route-level code splitting (`React.lazy` + `Suspense`).

### Collectible registry (config-driven)

`src/collectibles.ts` is the single source of truth for all collectibles. Adding an entry here auto-generates the route in `App.tsx` and the homepage card in `HomePage.tsx`. See "Adding a new collectible" below.

### Shared infrastructure

All collection pages use shared building blocks to minimize duplication:

- **Layout:** `src/components/CollectionPageLayout.tsx` — handles loading, error, header+stats, scroll-to-top, cart panel (conditionally via `WithCart` wrapper). Every page wraps its content in this layout.
- **Data loading:** `src/hooks/useCollectionData.ts` — fetch + PapaParse + loading/error state. Checks `response.ok` for clear error on bad paths.
- **Hooks:** `useScrollToTop`, `usePageTitle` — used by the layout internally.
- **Components:** `CollectionHeader`, `EmptyState`, `ScrollToTopButton`, `FloatingCartButton`, `CardModal`, `CartPanel`, `OptimizedImage`
- **Utilities:** `src/utils/filters.ts` — `filterByQuantity()`, `computeSimpleStats(cards, keepThreshold?)`, `sortCards()`, `addSimpleCardToCart()`. Business rules (keep threshold) are configurable, defaulting to 2.
- **CSS:** `src/shared.css` — structural layout scoped under `.collection-page`, plus global styles for fixed-position elements (modal, cart, floating buttons). Page CSS files contain only theme colors and card-specific styles.

### Key data flow (Yu-Gi-Oh!, the most complex module)

1. CSV loaded from `public/yugioh/` → parsed by `src/utils/csvParser.ts` (PapaParse)
2. Keep/sell algorithm in `src/utils/algorithm.ts` groups cards by name, scores each version via `src/utils/scoring.ts` (rarity × 100 + language preference + tiebreaker), keeps 1 per unique (extension, rarity) combo with minimum 3 copies
3. Card images fetched from YGOPRODeck API, cached in localStorage (`src/utils/cardImages.ts`, `src/hooks/useCardImage.ts`)
4. Cart state persisted to localStorage via `src/hooks/useCart.ts`, exportable to CSV

### Simpler TCGs (Akira, Riftbound, Lorcana, Dreamcast)

Keep 1 copy, sell duplicates (qty >= 2). Each has its own page component with a `parseRows` function and card-specific rendering, using `useCollectionData` + `CollectionPageLayout` for everything else.

### Directory layout

- `src/collectibles.ts` — collectible registry (routes + homepage auto-generated)
- `src/pages/` — one page component per TCG + HomePage
- `src/components/` — shared components (CollectionPageLayout, CollectionHeader, CardModal, CartPanel, etc.)
- `src/hooks/` — useCollectionData, useCart, useCardImage, useScrollToTop, usePageTitle
- `src/utils/` — algorithm, scoring, csvParser, cardImages, cart, filters
- `src/types.ts` — shared TypeScript interfaces
- `src/shared.css` — shared structural CSS for collection pages
- `public/<tcg>/` — CSV collection data and card images per TCG

## Adding a new collectible

### Step 1: Prepare data

Create `public/<slug>/collection.csv` with your CSV data and `public/<slug>/cards/` with card images.

### Step 2: Register in `src/collectibles.ts`

Add an entry to the `collectibles` array:

```typescript
{
  slug: 'mytcg',
  name: 'My TCG',
  logo: '/images/mytcg-logo.png',
  logoAlt: 'My TCG Logo',
  page: lazy(() => import('./pages/MyTcgPage')),
},
```

This auto-generates the route (`/mytcg`) and homepage card. No changes needed in `App.tsx` or `HomePage.tsx`.

### Step 3: Create the page component

Create `src/pages/MyTcgPage.tsx`. Use `AkiraPage.tsx` as a template (~185 lines). You need to write:

1. **Card interface** — fields specific to your TCG
2. **`parseRows` function** — transforms PapaParse output into your card type
3. **Filter/sort state** — which filters your page offers
4. **Card grid JSX** — how cards render in the grid
5. **Modal content JSX** — what the detail modal shows

Everything else (loading, error, header, stats, scroll-to-top, cart panel, empty state) is handled by `CollectionPageLayout` + `useCollectionData`:

```tsx
export default function MyTcgPage() {
  const { data: allCards, loading, error } = useCollectionData<MyCard>(
    '/mytcg/collection.csv',
    parseMyTcgRows,
    { header: true },  // PapaParse options
  );
  // ... filter state ...
  const stats = computeSimpleStats(allCards);

  return (
    <CollectionPageLayout
      pageTitle="My TCG - Guimove"
      title="My TCG Collection"
      subtitle={`${allCards.length} cards`}
      cssClass="mytcg-page"
      loading={loading}
      error={error}
      stats={[...]}
      hasCart={true}  // set false for non-sellable collections
    >
      {({ cart, openCart }) => (
        <>
          {/* filters, card grid, modal */}
        </>
      )}
    </CollectionPageLayout>
  );
}
```

### Step 4: Create page CSS

Create `src/pages/MyTcgPage.css` with theme colors and card-specific styles only. Structural CSS (header, controls, modal, cart, buttons) comes from `shared.css` via the `.collection-page` class.

### Step 5: Docker volume (optional)

Add to `docker-compose.yml` for CSV hot-reload without rebuild:

```yaml
- ./public/mytcg:/usr/share/nginx/html/mytcg:ro
```

## Yu-Gi-Oh! Scoring System

38 rarity tiers scored in `src/utils/scoring.ts` (S10K=100 down to C=50). Language preference: French > English > Spanish. The algorithm in `algorithm.ts` ensures at least max(3, numUniqueVersions) copies are kept per card.

## Language

The application UI labels are in French. Code, comments, documentation (README, CLAUDE.md), and variable names are in English.
