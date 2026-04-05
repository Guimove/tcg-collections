import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface CollectibleEntry {
  slug: string;
  name: string;
  logo: string;
  logoAlt: string;
  page: LazyExoticComponent<ComponentType>;
}

export interface ComingSoonEntry {
  name: string;
  logo: string;
  logoAlt: string;
}

export const collectibles: CollectibleEntry[] = [
  {
    slug: 'akira',
    name: 'Dragon Ball Akira',
    logo: '/images/dragon-ball-logo.png',
    logoAlt: 'Dragon Ball Akira Logo',
    page: lazy(() => import('./pages/AkiraPage')),
  },
  {
    slug: 'yugioh',
    name: 'Yu-Gi-Oh!',
    logo: '/images/yugioh-logo.png',
    logoAlt: 'Yu-Gi-Oh! Logo',
    page: lazy(() => import('./pages/YugiohPage')),
  },
  {
    slug: 'riftbound',
    name: 'Riftbound',
    logo: '/images/riftbound-logo.png',
    logoAlt: 'Riftbound Logo',
    page: lazy(() => import('./pages/RiftboundPage')),
  },
  {
    slug: 'lorcana',
    name: 'Lorcana',
    logo: '/images/lorcana-logo.png',
    logoAlt: 'Lorcana Logo',
    page: lazy(() => import('./pages/LorcanaPage')),
  },
  {
    slug: 'dreamcast',
    name: 'Dreamcast',
    logo: '/images/dreamcast-logo.png',
    logoAlt: 'Dreamcast Logo',
    page: lazy(() => import('./pages/DreamcastPage')),
  },
];

export const comingSoon: ComingSoonEntry[] = [
  {
    name: 'Rise',
    logo: '/images/rise-logo.png',
    logoAlt: 'Rise Logo',
  },
  {
    name: 'One Piece',
    logo: '/images/one-piece-logo.png',
    logoAlt: 'One Piece Logo',
  },
];
