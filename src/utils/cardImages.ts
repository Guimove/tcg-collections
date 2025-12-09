// Load cache from localStorage
const loadCache = () => {
  try {
    const stored = localStorage.getItem('ygo-image-cache');
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Map<string, string | null>(Object.entries(parsed));
    }
  } catch (e) {
    console.warn('Failed to load cache from localStorage:', e);
  }
  return new Map<string, string | null>();
};

const loadImageByName = () => {
  try {
    const stored = localStorage.getItem('ygo-image-by-name');
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Map<string, string>(Object.entries(parsed));
    }
  } catch (e) {
    console.warn('Failed to load imageByName from localStorage:', e);
  }
  return new Map<string, string>();
};

const loadFailedNames = () => {
  try {
    const stored = localStorage.getItem('ygo-failed-names');
    if (stored) {
      return new Set<string>(JSON.parse(stored));
    }
  } catch (e) {
    console.warn('Failed to load failed names from localStorage:', e);
  }
  return new Set<string>();
};

function proxifyImageUrl(imageUrl: string): string {
  if (import.meta.env.PROD) {
    return `/api/card-image?url=${encodeURIComponent(imageUrl)}`;
  }
  return imageUrl;
}

function migrateCache(cache: Map<string, string | null>): Map<string, string | null> {
  const migrated = new Map<string, string | null>();

  for (const [key, value] of cache.entries()) {
    if (value && value.startsWith('https://images.ygoprodeck.com/')) {
      migrated.set(key, proxifyImageUrl(value));
    } else {
      migrated.set(key, value);
    }
  }

  return migrated;
}

function migrateImageByName(cache: Map<string, string>): Map<string, string> {
  const migrated = new Map<string, string>();

  for (const [key, value] of cache.entries()) {
    if (value.startsWith('https://images.ygoprodeck.com/')) {
      migrated.set(key, proxifyImageUrl(value));
    } else {
      migrated.set(key, value);
    }
  }

  return migrated;
}

const imageCache = migrateCache(loadCache());
const imageByName = migrateImageByName(loadImageByName());
const failedNames = loadFailedNames();
const pendingRequests = new Map<string, Promise<string | null>>();
const CARDINFO_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const FETCH_DELAY_MS = 50;

console.log(`[Cache] Loaded ${imageCache.size} cached images, ${imageByName.size} name mappings, and ${failedNames.size} failed cards from localStorage`);

export function clearImageCache() {
  imageCache.clear();
  imageByName.clear();
  failedNames.clear();
  localStorage.removeItem('ygo-image-cache');
  localStorage.removeItem('ygo-image-by-name');
  localStorage.removeItem('ygo-failed-names');
  console.log('[Cache] Cache cleared! Reload the page to refetch images.');
}

export function clearFailedNames() {
  const failedCount = failedNames.size;
  failedNames.clear();

  let removedCount = 0;
  for (const [key, value] of imageCache.entries()) {
    if (value === null) {
      imageCache.delete(key);
      removedCount++;
    }
  }

  localStorage.removeItem('ygo-failed-names');
  saveCache();
  console.log(`[Cache] Cleared ${failedCount} failed card codes and ${removedCount} null cache entries. Reload the page to retry fetching them.`);
}

const cacheListeners = new Set<() => void>();

export function onCacheUpdate(listener: () => void) {
  cacheListeners.add(listener);
  return () => {
    cacheListeners.delete(listener);
  };
}

function notifyCacheUpdate() {
  cacheListeners.forEach(listener => listener());
}

function cacheImage(cardCode: string, cardName: string, imageUrl: string) {
  const proxifiedUrl = proxifyImageUrl(imageUrl);
  imageCache.set(cardCode, proxifiedUrl);
  imageByName.set(cardName.toLowerCase(), proxifiedUrl);
  saveCache();
  notifyCacheUpdate();
}

export function getCachedImage(cardCode: string, cardName?: string): string | null | undefined {
  const byCode = imageCache.get(cardCode);
  if (byCode !== undefined && byCode !== null) {
    return byCode;
  }

  if (cardName) {
    const byName = imageByName.get(cardName.toLowerCase());
    if (byName) {
      imageCache.set(cardCode, byName);
      saveCache();
      return byName;
    }
  }

  if (byCode !== undefined) {
    return byCode;
  }

  return undefined;
}

if (typeof window !== 'undefined') {
  (window as any).clearImageCache = clearImageCache;
  (window as any).clearFailedNames = clearFailedNames;
  console.log('[Cache] Use clearImageCache() or clearFailedNames() in console to clear the cache');
}

const saveCache = () => {
  try {
    const obj = Object.fromEntries(imageCache.entries());
    localStorage.setItem('ygo-image-cache', JSON.stringify(obj));

    const nameObj = Object.fromEntries(imageByName.entries());
    localStorage.setItem('ygo-image-by-name', JSON.stringify(nameObj));
  } catch (e) {
    console.warn('Failed to save cache to localStorage:', e);
  }
};

const saveFailedNames = () => {
  try {
    localStorage.setItem('ygo-failed-names', JSON.stringify(Array.from(failedNames)));
  } catch (e) {
    console.warn('Failed to save failed names to localStorage:', e);
  }
};

type QueueItem<T> = {
  task: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

const queue: QueueItem<any>[] = [];
let activeRequests = 0;
let rateLimitDelay = FETCH_DELAY_MS;

function runQueue() {
  while (queue.length > 0) {
    const { task, resolve, reject } = queue.shift()!;
    activeRequests++;

    task()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        setTimeout(() => {
          activeRequests--;
          runQueue();
        }, rateLimitDelay);
      });
  }
}

async function fetchWithRetry<T>(url: string): Promise<T | null> {
  const response = await fetch(url);

  if (response.status === 429) {
    console.warn('[API] Rate limit hit (429), slowing down requests...');
    rateLimitDelay = Math.min(rateLimitDelay * 2, 1000); // Double delay up to 1s

    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, 2000));
    return fetchWithRetry<T>(url);
  }

  if (response.status === 400) {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  // Reset delay on success
  rateLimitDelay = FETCH_DELAY_MS;

  return (await response.json()) as T;
}

function enqueueFetch<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    runQueue();
  });
}

function buildCandidateSetcodes(cardCode: string): string[] {
  const normalized = cardCode.trim().toUpperCase();
  const variants = new Set<string>();
  const prefix = normalized.split('-')[0];

  const regionalExtensions = ['L5DD', 'LDD'];
  if (regionalExtensions.includes(prefix)) {
    return [];
  }

  const starterDeckMap: Record<string, string> = {
    'DDK': 'SDK',
    'DDJ': 'SDJ',
    'DDY': 'SDY',
    'DDP': 'SDP',
  };

  let converted = normalized;

  if (starterDeckMap[prefix]) {
    converted = normalized.replace(prefix, starterDeckMap[prefix]);
  }

  converted = converted
    .replace(/-FR([A-Z]?\d)/gi, '-EN$1')
    .replace(/-CA(\d)/gi, '-EN$1');

  if (converted.includes('-F') && !converted.includes('-FR')) {
    variants.add(converted.replace(/-F(\d)/gi, '-$1'));
  }

  variants.add(converted);

  const cleaned = converted.replace(/-EN[A-Z](\d)/gi, '-EN$1');
  if (cleaned !== converted) variants.add(cleaned);

  const allVariants = Array.from(variants);
  allVariants.forEach((code) => {
    const padded = code.replace(/-(EN)?(\d{1,2})$/gi, (_match, prefix, digits) => {
      const dash = prefix ? `-${prefix}` : '-';
      return `${dash}${digits.padStart(3, '0')}`;
    });
    if (padded !== code) variants.add(padded);
  });

  return Array.from(variants).filter(code =>
    code.includes('-EN') || code.match(/-\d{3}$/)
  );
}

async function fetchJson<T>(url: URL): Promise<T | null> {
  return enqueueFetch(async () => {
    return fetchWithRetry<T>(url.toString());
  });
}

async function fetchCards(params: Record<string, string>): Promise<any[] | null> {
  const url = new URL(CARDINFO_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
  const payload = await fetchJson<{ data?: any[] }>(url);
  return payload?.data || null;
}

function findCardBySetcode(cards: any[], candidateSetcodes: string[]): any | null {
  for (const candidate of candidateSetcodes) {
    const exactMatch = cards.find((card: any) =>
      card.card_sets?.some((set: any) =>
        set.set_code?.toUpperCase() === candidate
      )
    );
    if (exactMatch) return exactMatch;
  }

  for (const candidate of candidateSetcodes) {
    const prefix = candidate.split('-')[0];
    if (prefix.length >= 3) {
      const prefixMatch = cards.find((card: any) =>
        card.card_sets?.some((set: any) =>
          set.set_code?.toUpperCase().startsWith(prefix)
        )
      );
      if (prefixMatch) return prefixMatch;
    }
  }

  return null;
}


function extractImage(card: any): string | null {
  if (!card?.card_images?.length) return null;
  return card.card_images[0].image_url_cropped || card.card_images[0].image_url_small || card.card_images[0].image_url || null;
}

export async function getCardImage(
  cardCode: string,
  cardName: string
): Promise<string | null> {
  if (imageCache.has(cardCode)) {
    return imageCache.get(cardCode)!;
  }

  if (failedNames.has(cardCode)) {
    imageCache.set(cardCode, null);
    return null;
  }

  if (pendingRequests.has(cardCode)) {
    return pendingRequests.get(cardCode)!;
  }

  const fetchPromise = (async () => {
    try {
    const candidateCodes = buildCandidateSetcodes(cardCode);
    console.log(`[API] ${cardCode} → Candidates: ${candidateCodes.slice(0, 3).join(', ')}`);

    for (const code of candidateCodes) {
      if (code.includes('-')) {
        const url = new URL('https://db.ygoprodeck.com/api/v7/cardsetsinfo.php');
        url.searchParams.append('setcode', code);

        const setInfo = await fetchJson<{ id?: number; name?: string }>(url);
        if (setInfo?.id) {
          console.log(`[API] ✅ Found via setcode ${code}: ${setInfo.name}`);

          const cardById = await fetchCards({ id: String(setInfo.id) });
          if (cardById?.length) {
            const imageUrl = extractImage(cardById[0]);
            if (imageUrl) {
              cacheImage(cardCode, cardName, imageUrl);
              console.log(`[API] 🖼️  Image found for ${cardCode}`);
              return imageUrl;
            }
          }
        }
      }
    }

    const frenchCards = await fetchCards({ fname: cardName, language: 'fr' });
    if (frenchCards?.length) {
      console.log(`[API] ✅ Found "${cardName}" (fr): ${frenchCards[0].name}`);
      const matchedCard = findCardBySetcode(frenchCards, candidateCodes);
      const targetCard = matchedCard || frenchCards[0];
      const imageUrl = extractImage(targetCard);

      if (imageUrl) {
        cacheImage(cardCode, cardName, imageUrl);
        console.log(`[API] 🖼️  Image found for ${cardCode}`);
        return imageUrl;
      }
    }

    if (frenchCards !== null) {
      const englishCards = await fetchCards({ fname: cardName });
      if (englishCards?.length) {
        console.log(`[API] ✅ Found "${cardName}" (en): ${englishCards[0].name}`);
        const matchedCard = findCardBySetcode(englishCards, candidateCodes);
        const targetCard = matchedCard || englishCards[0];
        const imageUrl = extractImage(targetCard);

        if (imageUrl) {
          cacheImage(cardCode, cardName, imageUrl);
          console.log(`[API] 🖼️  Image found for ${cardCode}`);
          return imageUrl;
        }
      }
    }

      console.log(`[API] ❌ No image found for ${cardCode} (${cardName})`);
      failedNames.add(cardCode);
      saveFailedNames();
      imageCache.set(cardCode, null);
      saveCache();
      return null;

    } catch (error) {
      console.error(`Error fetching image for ${cardCode} (${cardName}):`, error);
      imageCache.set(cardCode, null);
      saveCache();
      return null;
    } finally {
      pendingRequests.delete(cardCode);
    }
  })();

  pendingRequests.set(cardCode, fetchPromise);

  return fetchPromise;
}
