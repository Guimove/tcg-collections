interface PriceCache {
  prices: Record<string, number>;
  timestamp: number;
}

const CACHE_KEY = 'yugioh_prices_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const API_BASE = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const RATE_LIMIT_MS = 200; // 5 req/sec

function loadCache(): PriceCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: PriceCache = JSON.parse(raw);
    if (Date.now() - cache.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cache;
  } catch {
    return null;
  }
}

function saveCache(prices: Record<string, number>): void {
  const cache: PriceCache = { prices, timestamp: Date.now() };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full, ignore
  }
}

export async function fetchCardPrices(
  cardNames: string[],
  onProgress?: (loaded: number, total: number) => void,
): Promise<Map<string, number>> {
  const cache = loadCache();
  const cached = cache?.prices ?? {};
  const result = new Map<string, number>();

  // Use cached values first
  const toFetch: string[] = [];
  for (const name of cardNames) {
    if (name in cached) {
      result.set(name, cached[name]);
    } else {
      toFetch.push(name);
    }
  }

  // Deduplicate
  const uniqueToFetch = [...new Set(toFetch)];

  // Fetch missing prices
  for (let i = 0; i < uniqueToFetch.length; i++) {
    const name = uniqueToFetch[i];
    try {
      const response = await fetch(`${API_BASE}?name=${encodeURIComponent(name)}`);
      if (response.ok) {
        const data = await response.json();
        const price = parseFloat(data.data?.[0]?.card_prices?.[0]?.cardmarket_price ?? '0');
        result.set(name, price);
        cached[name] = price;
      } else {
        result.set(name, 0);
        cached[name] = 0;
      }
    } catch {
      result.set(name, 0);
      cached[name] = 0;
    }

    if (onProgress) {
      onProgress(i + 1, uniqueToFetch.length);
    }

    // Rate limiting
    if (i < uniqueToFetch.length - 1) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
    }
  }

  // Save updated cache
  saveCache(cached);

  return result;
}

export function clearPriceCache(): void {
  localStorage.removeItem(CACHE_KEY);
}
