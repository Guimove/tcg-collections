# Repository Guidelines

## Project Structure & Module Organization
This is a Vite + React 19 + TypeScript SPA for managing collectible datasets from static CSV files. The main app lives in `src/`: `src/pages/` contains one page per collectible plus `HomePage.tsx`, `src/components/` holds shared UI such as `CollectionPageLayout.tsx`, `src/hooks/` contains reusable state/data hooks, and `src/utils/` contains parsing, filtering, scoring, and cart logic. Static datasets and images live under `public/<slug>/`, for example `public/lorcana/collection.csv` or `public/dreamcast/covers/`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start the local Vite server on `http://localhost:5173`.
- `npm run build`: run TypeScript checks and create the production bundle in `dist/`.
- `npm run preview`: serve the built app locally.
- `docker-compose up -d --build`: run the Nginx container on `http://localhost:8080` for deployment-style checks.

## Coding Style & Naming Conventions
Use TypeScript with strict typing and React function components. Follow the existing naming scheme: PascalCase for components/pages (`LorcanaPage.tsx`), camelCase for hooks/utilities (`useCollectionData.ts`, `csvParser.ts`). Keep code in English; UI copy and README content stay in French. Put page-specific styles next to the page file and keep shared structural styling in `src/shared.css`.

## Adding a New Collectible
The repo is now registry-driven. Add a new entry to `src/collectibles.ts`; this automatically creates the route and homepage card. Then create `public/<slug>/collection.csv`, any related assets, and `src/pages/MyTcgPage.tsx`. Use `AkiraPage.tsx` as the template: write a card interface, a `parseRows` mapper, page filters, and card/modal rendering. Reuse `useCollectionData`, `CollectionPageLayout`, and `computeSimpleStats()` instead of duplicating loading or layout logic.

## Testing Guidelines
There is no formal test suite or linter configured. `npm run build` is the required verification step for every change. For UI or CSV changes, also smoke-test the affected route in `npm run dev`, especially loading states, filters, cart behavior, and missing-image fallbacks.

## Commit & Pull Request Guidelines
Prefer short, imperative commit subjects such as `update dreamcast` or scoped maintenance commits like `chore(deps): ...`. PRs should include a concise summary, affected collectibles/routes, verification notes, linked issues if relevant, and screenshots for visible UI changes.
