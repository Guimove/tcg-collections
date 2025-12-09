import { CardRow, ProcessedCardVersion, AggregatedCard } from '../types';
import { getRarityScore, getLanguageScore, calculateTotalScore } from './scoring';

/**
 * Main algorithm to process card collection and calculate keep/sell quantities
 */
export function processCardCollection(rows: CardRow[]): AggregatedCard[] {
  // Group rows by card name
  const cardGroups = new Map<string, CardRow[]>();

  rows.forEach((row) => {
    const cardName = row['Nom de la carte'];
    if (!cardGroups.has(cardName)) {
      cardGroups.set(cardName, []);
    }
    cardGroups.get(cardName)!.push(row);
  });

  // Process each card group
  const results: AggregatedCard[] = [];

  for (const [cardName, cardRows] of cardGroups.entries()) {
    const processedCard = processCardGroup(cardName, cardRows);
    results.push(processedCard);
  }

  return results;
}

/**
 * Process a single card (all versions of same card name)
 */
function processCardGroup(cardName: string, rows: CardRow[]): AggregatedCard {
  // Step 1: Calculate scores for each row
  const scoredRows: ProcessedCardVersion[] = rows.map((row, index) => {
    const rarityScore = getRarityScore(row.Rareté);
    const languageScore = getLanguageScore(row.Langue);
    const totalScore = calculateTotalScore(rarityScore, languageScore, index);

    return {
      ...row,
      rarityScore,
      languageScore,
      totalScore,
      keepForExtension: 0,
      extraKeep: 0,
      keepTotal: 0,
      toSell: 0,
      leftAfterExtension: 0,
    };
  });

  // Step 2: Count unique (extension, rareté) combinations with Quantité > 0
  const extensionRarityCombos = new Set<string>();
  scoredRows.forEach((row) => {
    if (row.Quantité > 0) {
      extensionRarityCombos.add(`${row.Extension}|${row.Rareté}`);
    }
  });

  const numCombinations = extensionRarityCombos.size;
  const totalToKeep = Math.max(3, numCombinations);

  // Step 3: Keep 1 per (extension, rareté) combination (highest score per combo)
  const extensionRarityGroups = new Map<string, ProcessedCardVersion[]>();

  scoredRows.forEach((row) => {
    const key = `${row.Extension}|${row.Rareté}`;
    if (!extensionRarityGroups.has(key)) {
      extensionRarityGroups.set(key, []);
    }
    extensionRarityGroups.get(key)!.push(row);
  });

  // For each (extension, rareté) combo, mark the highest scoring row to keep 1
  for (const [, comboRows] of extensionRarityGroups.entries()) {
    // Only consider rows with Quantité > 0
    const availableRows = comboRows.filter((r) => r.Quantité > 0);
    if (availableRows.length === 0) continue;

    // Find highest scoring row (usually by language)
    availableRows.sort((a, b) => b.totalScore - a.totalScore);
    const bestRow = availableRows[0];
    bestRow.keepForExtension = 1;
  }

  // Calculate leftAfterExtension for all rows
  scoredRows.forEach((row) => {
    row.leftAfterExtension = row.Quantité - row.keepForExtension;
  });

  // Calculate how many already kept from extensions
  const alreadyKeptFromExtensions = scoredRows.reduce(
    (sum, row) => sum + row.keepForExtension,
    0
  );

  const remainingToKeep = Math.max(0, totalToKeep - alreadyKeptFromExtensions);

  // Step 4: Keep extra copies to reach totalToKeep
  // Sort all rows by totalScore (descending)
  const sortedRows = [...scoredRows].sort((a, b) => b.totalScore - a.totalScore);

  let allocated = 0;
  for (const row of sortedRows) {
    if (allocated >= remainingToKeep) {
      row.extraKeep = 0;
    } else {
      const canAllocate = Math.min(
        row.leftAfterExtension,
        remainingToKeep - allocated
      );
      row.extraKeep = canAllocate;
      allocated += canAllocate;
    }
  }

  // Step 5: Calculate final keepTotal and toSell
  scoredRows.forEach((row) => {
    row.keepTotal = row.keepForExtension + row.extraKeep;
    row.toSell = row.Quantité - row.keepTotal;
  });

  // Calculate total for sale
  const totalForSale = scoredRows.reduce((sum, row) => sum + row.toSell, 0);

  return {
    cardName,
    totalToKeep,
    numExtensions: numCombinations, // nombre de combinaisons (extension, rareté)
    versions: scoredRows,
    totalForSale,
  };
}

/**
 * Get only items that are for sale (toSell > 0)
 */
export function getMarketplaceItems(aggregatedCards: AggregatedCard[]) {
  const items: ProcessedCardVersion[] = [];

  aggregatedCards.forEach((card) => {
    card.versions.forEach((version) => {
      if (version.toSell > 0) {
        items.push(version);
      }
    });
  });

  return items;
}

/**
 * Get debug info for a specific card
 */
export interface CardDebugInfo {
  cardName: string;
  totalToKeep: number;
  numExtensions: number;
  versions: Array<{
    extension: string;
    rarity: string;
    language: string;
    quantité: number;
    rarityScore: number;
    languageScore: number;
    totalScore: number;
    keepForExtension: number;
    extraKeep: number;
    keepTotal: number;
    toSell: number;
  }>;
}

export function getCardDebugInfo(
  cardName: string,
  aggregatedCards: AggregatedCard[]
): CardDebugInfo | null {
  const card = aggregatedCards.find((c) => c.cardName === cardName);
  if (!card) return null;

  return {
    cardName: card.cardName,
    totalToKeep: card.totalToKeep,
    numExtensions: card.numExtensions,
    versions: card.versions.map((v) => ({
      extension: v.Extension,
      rarity: v.Rareté,
      language: v.Langue,
      quantité: v.Quantité,
      rarityScore: v.rarityScore,
      languageScore: v.languageScore,
      totalScore: v.totalScore,
      keepForExtension: v.keepForExtension,
      extraKeep: v.extraKeep,
      keepTotal: v.keepTotal,
      toSell: v.toSell,
    })),
  };
}
