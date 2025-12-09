// Raw CSV row data
export interface CardRow {
  Langue: string;
  Extension: string;
  Code: string;
  'Nom de la carte': string;
  Rareté: string;
  '1st Edition': string;
  'Unlimited': string;
  'Limited / Autre': string;
  Quantité: number;
  'N° Artwork': string;
  Reprint: string;
}

// Processed card version with calculations
export interface ProcessedCardVersion extends CardRow {
  rarityScore: number;
  languageScore: number;
  totalScore: number;
  keepForExtension: number;
  extraKeep: number;
  keepTotal: number;
  toSell: number;
  leftAfterExtension: number;
}

// Aggregated card (by name)
export interface AggregatedCard {
  cardName: string;
  totalToKeep: number;
  numExtensions: number;
  versions: ProcessedCardVersion[];
  totalForSale: number;
}

// For marketplace display
export interface MarketplaceItem {
  cardName: string;
  extension: string;
  rarity: string;
  language: string;
  code: string;
  quantityForSale: number;
  artworkNumber: string;
  rarityScore: number;
  firstEdition: string;
  unlimited: string;
  limitedOther: string;
}

// Cart item
export interface CartItem {
  cardName: string;
  extension: string;
  code: string;
  rarity: string;
  edition: string; // "1st", "Unlimited", "Limited", or "N/A"
  quantity: number;
  maxQuantity: number; // Max available to sell
}
