import { useEffect, useState } from 'react';
import { getCardImage, getCachedImage, onCacheUpdate } from '../utils/cardImages';

export function useCardImage(
  cardCode: string,
  cardName: string,
  enabled = true
) {
  const cachedUrl = getCachedImage(cardCode, cardName);
  const [imageUrl, setImageUrl] = useState<string | null>(cachedUrl ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return onCacheUpdate(() => {
      const newCached = getCachedImage(cardCode, cardName);
      if (newCached !== undefined && newCached !== imageUrl) {
        setImageUrl(newCached);
        setLoading(false);
      }
    });
  }, [cardCode, cardName, imageUrl]);

  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    if (!enabled) {
      setImageUrl(null);
      setLoading(false);
      return;
    }

    const cached = getCachedImage(cardCode, cardName);
    if (cached !== undefined) {
      setImageUrl(cached);
      setLoading(false);
      return;
    }

    setLoading(true);

    timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 4000);

    getCardImage(cardCode, cardName)
      .then((url) => {
        if (!cancelled) setImageUrl(url);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [cardCode, cardName, enabled]);

  return { imageUrl, loading };
}
