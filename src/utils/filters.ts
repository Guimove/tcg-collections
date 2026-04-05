export type QuantityFilterType = 'all' | 'owned' | 'not-owned' | 'for-sale';

export function filterByQuantity(quantity: number, filter: QuantityFilterType): boolean {
  switch (filter) {
    case 'owned':
      return quantity > 0;
    case 'not-owned':
      return quantity === 0;
    case 'for-sale':
      return quantity >= 2;
    case 'all':
    default:
      return true;
  }
}

export interface SimpleCollectionStats {
  totalCards: number;
  uniqueOwned: number;
  totalForSale: number;
  uniqueForSale: number;
}

export function computeSimpleStats(cards: { quantity: number }[], keepThreshold = 2): SimpleCollectionStats {
  return {
    totalCards: cards.reduce((sum, card) => sum + card.quantity, 0),
    uniqueOwned: cards.filter(card => card.quantity > 0).length,
    totalForSale: cards.reduce((sum, card) => card.quantity >= keepThreshold ? sum + (card.quantity - (keepThreshold - 1)) : sum, 0),
    uniqueForSale: cards.filter(card => card.quantity >= keepThreshold).length,
  };
}

export type SortDirection = 'asc' | 'desc';

export function sortCards<T>(
  items: T[],
  sortBy: string,
  direction: SortDirection,
  getters: Record<string, (item: T) => string | number>,
): T[] {
  return [...items].sort((a, b) => {
    const getter = getters[sortBy];
    if (!getter) return 0;
    const va = getter(a);
    const vb = getter(b);
    const comparison = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
    return direction === 'asc' ? comparison : -comparison;
  });
}

export interface SimpleCartItemInput {
  cardName: string;
  extension: string;
  code: string;
  rarity: string;
  edition: string;
  quantity: number;
  maxQuantity: number;
}

export function addSimpleCardToCart(
  card: { quantity: number },
  cartItem: SimpleCartItemInput,
  addToCart: (item: SimpleCartItemInput) => void,
  openCart: () => void,
  keepThreshold = 2,
): void {
  if (card.quantity < keepThreshold) {
    alert('Cette carte n\'est pas disponible à la vente (quantité insuffisante)');
    return;
  }
  addToCart(cartItem);
  openCart();
}
