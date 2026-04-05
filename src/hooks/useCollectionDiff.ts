import { useState, useEffect, useMemo } from 'react';

interface CollectionSnapshot {
  timestamp: number;
  cards: Record<string, number>; // key -> quantity
}

export interface CollectionDiff {
  newCards: string[];
  removedCards: string[];
  increasedQty: { key: string; from: number; to: number }[];
  decreasedQty: { key: string; from: number; to: number }[];
  lastUpdated: Date | null;
}

const EMPTY_DIFF: CollectionDiff = {
  newCards: [],
  removedCards: [],
  increasedQty: [],
  decreasedQty: [],
  lastUpdated: null,
};

export function useCollectionDiff(
  collectionKey: string,
  cards: { key: string; quantity: number }[],
  loading: boolean,
): { diff: CollectionDiff; dismissDiff: () => void } {
  const [diff, setDiff] = useState<CollectionDiff>(EMPTY_DIFF);
  const storageKey = `collection_snapshot_${collectionKey}`;

  // Build a stable fingerprint of card contents so the effect reruns on any data change
  const cardsFingerprint = useMemo(() => {
    if (loading || cards.length === 0) return '';
    return cards.map(c => `${c.key}:${c.quantity}`).join('|');
  }, [cards, loading]);

  useEffect(() => {
    if (!cardsFingerprint) return;

    const currentMap: Record<string, number> = {};
    for (const card of cards) {
      currentMap[card.key] = card.quantity;
    }

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const prev: CollectionSnapshot = JSON.parse(raw);
        const prevMap = prev.cards;

        const newCards: string[] = [];
        const removedCards: string[] = [];
        const increasedQty: { key: string; from: number; to: number }[] = [];
        const decreasedQty: { key: string; from: number; to: number }[] = [];

        for (const [key, qty] of Object.entries(currentMap)) {
          if (!(key in prevMap)) {
            newCards.push(key);
          } else if (qty > prevMap[key]) {
            increasedQty.push({ key, from: prevMap[key], to: qty });
          } else if (qty < prevMap[key]) {
            decreasedQty.push({ key, from: prevMap[key], to: qty });
          }
        }

        for (const key of Object.keys(prevMap)) {
          if (!(key in currentMap)) {
            removedCards.push(key);
          }
        }

        const hasChanges = newCards.length > 0 || removedCards.length > 0 || increasedQty.length > 0 || decreasedQty.length > 0;

        if (hasChanges) {
          setDiff({
            newCards,
            removedCards,
            increasedQty,
            decreasedQty,
            lastUpdated: new Date(prev.timestamp),
          });
        }
      }
    } catch {
      // First visit or corrupted data
    }

    const snapshot: CollectionSnapshot = {
      timestamp: Date.now(),
      cards: currentMap,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(snapshot));
    } catch {
      // localStorage full
    }
  }, [cardsFingerprint, storageKey]);

  const dismissDiff = () => setDiff(EMPTY_DIFF);

  return { diff, dismissDiff };
}
