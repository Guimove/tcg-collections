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

**React 19 + TypeScript + Vite SPA** with React Router for navigation.

### Shared infrastructure

All collection pages use shared building blocks:
- `src/hooks/useScrollToTop.ts` — scroll-to-top visibility + smooth scroll
- `src/hooks/usePageTitle.ts` — sets document.title
- `src/components/CollectionHeader.tsx` — back link, title, subtitle, stats grid
- `src/components/EmptyState.tsx` — icon + title + message empty state
- `src/components/ScrollToTopButton.tsx` — conditional scroll-to-top button
- `src/components/FloatingCartButton.tsx` — cart button with badge
- `src/components/CardModal.tsx` — modal wrapper with overlay click-to-close and ESC key
- `src/utils/filters.ts` — `filterByQuantity()`, `computeSimpleStats()`, shared types
- `src/shared.css` — structural CSS shared across all collection pages (layout, modal, controls)

### Adding a new collectible

1. Create `src/pages/<Tcg>Page.tsx` — use an existing simple page (e.g. AkiraPage) as template
2. Create `src/pages/<Tcg>Page.css` — only theme colors and card-specific styles; structural CSS comes from `shared.css`
3. Add route in `src/App.tsx`
4. Add card link in `src/pages/HomePage.tsx`
5. Add CSV + images in `public/<tcg>/`
6. Add volume mount in `docker-compose.yml`

### Key data flow (Yu-Gi-Oh!, the most complex module)

1. CSV loaded from `public/yugioh/` → parsed by `src/utils/csvParser.ts` (PapaParse)
2. Keep/sell algorithm in `src/utils/algorithm.ts` groups cards by name, scores each version via `src/utils/scoring.ts` (rarity × 100 + language preference + tiebreaker), keeps 1 per unique (extension, rarity) combo with minimum 3 copies
3. Card images fetched from YGOPRODeck API, cached in localStorage (`src/utils/cardImages.ts`, `src/hooks/useCardImage.ts`)
4. Cart state persisted to localStorage via `src/hooks/useCart.ts`, exportable to CSV

### Simpler TCGs (Akira, Riftbound, Lorcana, Dreamcast)

Keep 1 copy, sell duplicates (qty >= 2). Each has its own page component and CSV in `public/<tcg>/`.

### Directory layout

- `src/pages/` — one page component per TCG + HomePage
- `src/components/` — shared components (CollectionHeader, EmptyState, CardModal, CartPanel, etc.)
- `src/hooks/` — useCart, useCardImage, useScrollToTop, usePageTitle
- `src/utils/` — algorithm, scoring, csvParser, cardImages, cart, filters
- `src/types.ts` — shared TypeScript interfaces
- `src/shared.css` — shared structural CSS for collection pages
- `public/<tcg>/` — CSV collection data and card images per TCG

## Yu-Gi-Oh! Scoring System

38 rarity tiers scored in `src/utils/scoring.ts` (S10K=100 down to C=50). Language preference: French > English > Spanish. The algorithm in `algorithm.ts` ensures at least max(3, numUniqueVersions) copies are kept per card.

## Language

The application UI and README are in French. Code (variables, comments) is in English.
