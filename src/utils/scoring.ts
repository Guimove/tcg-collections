// Rarity scores mapping
export const RARITY_SCORES: Record<string, number> = {
  // Codes et labels français
  'S10K': 100,
  'Secrète 10000': 100,
  'STR': 98,
  'Starlight Rare': 98,
  'G': 97,
  'Ghost Rare': 97,
  'GG': 96,
  'Ghost Gold Rare': 96,
  'QCR': 95,
  'Secrète Rare Quart de Siècle': 95,
  'EXS': 94,
  'Extra Secrète': 94,
  'RSC': 93,
  'Remote Secrète Rare': 93,
  'PHR': 92,
  'Pharaonique Rare': 92,
  'COL': 91,
  "Collector's Rare": 91,
  'UTR': 90,
  'Ultimate Rare': 90,
  'PRG': 88,
  'Premium Gold Rare': 88,
  'GS': 86,
  'Gold Secrète Rare': 86,
  'GLD': 84,
  'Gold Rare': 84,
  'SPL': 83,
  'Secrète Platinum': 83,
  'SCRB': 82,
  'Secret Rare Blasonnée': 82,
  'SCR': 80,
  'Secrète Rare': 80,
  'PLA': 78,
  'Platinum Rare': 78,
  'PRI': 77,
  'Prismatique': 77,
  'PAR': 74,
  'Parallèle Rare': 74,
  'UAR': 73,
  'Ultra Argent': 73,
  'UVE': 73,
  'Ultra Rare Vert': 73,
  'UVI': 73,
  'Ultra Rare Violet': 73,
  'URO': 73,
  'Ultra Rare Rouge': 73,
  'UBL': 72,
  'Ultra Rare Bleu': 72,
  'UB': 72,
  'Ultra Blasonnée': 72,
  'UDT': 71,
  'Ultra Rare Duel Terminal': 71,
  'U': 70,
  'Ultra Rare': 70,
  'SHA': 66,
  'Shatterfoil Rare': 66,
  'SFR': 65,
  'Starfoil Rare': 65,
  'MO': 64,
  'Mosaic Rare': 64,
  'SDT': 63,
  'Super Rare Duel Terminal': 63,
  'SR': 62,
  'Super Rare': 62,
  'RVI': 58,
  'Rare Violet': 58,
  'RVE': 58,
  'Rare Vert': 58,
  'RBR': 58,
  'Rare Bronze': 58,
  'RBL': 58,
  'Rare Bleu': 58,
  'RRO': 58,
  'Rare Rouge': 58,
  'RAR': 58,
  'Rare Argent': 58,
  'RDT': 57,
  'Rare Duel Terminal': 57,
  'R': 56,
  'Rare': 56,
  'CDT': 52,
  'Commune Duel Terminal': 52,
  'CPA': 51,
  'Commune Parallèle': 51,
  'C': 50,
  'Commune': 50,
};

// Language scores mapping
export const LANGUAGE_SCORES: Record<string, number> = {
  'Français (France)': 3,
  'Français (Canada)': 2,
  'Anglais (Europe)': 2,
  'Anglais (US)': 2,
  'Anglais (Monde)': 2,
  'Espagnol': 1,
};

export function getRarityScore(rarity: string): number {
  return RARITY_SCORES[rarity] ?? 0;
}

export function getLanguageScore(language: string): number {
  return LANGUAGE_SCORES[language] ?? 1;
}

export function calculateTotalScore(
  rarityScore: number,
  languageScore: number,
  rowIndex: number
): number {
  // totalScore = rarityScore * 100 + languageScore + tiny tiebreaker
  return rarityScore * 100 + languageScore + rowIndex * 1e-6;
}

// Get rarity display color based on score
export function getRarityColor(rarityScore: number): string {
  if (rarityScore >= 95) return '#ff0000'; // Red for ultra rare
  if (rarityScore >= 80) return '#ffd700'; // Gold
  if (rarityScore >= 70) return '#c0c0c0'; // Silver
  if (rarityScore >= 60) return '#4169e1'; // Blue
  if (rarityScore >= 50) return '#808080'; // Gray
  return '#505050'; // Dark gray
}

// Get rarity display name (short form)
export function getRarityDisplayName(rarity: string): string {
  // Find if it's a code or full name
  const rarityUpper = rarity.trim();

  // If it's already a short code (typically 2-4 chars), return as is
  if (rarityUpper.length <= 4) {
    return rarityUpper;
  }

  // Otherwise, find the code that matches this full name
  for (const [key, value] of Object.entries(RARITY_SCORES)) {
    if (key === rarityUpper) {
      // Find corresponding short code
      for (const [code, score] of Object.entries(RARITY_SCORES)) {
        if (score === value && code.length <= 4) {
          return code;
        }
      }
      break;
    }
  }

  return rarityUpper;
}

// Explicit mapping from codes to full names
const CODE_TO_FULL_NAME: Record<string, string> = {
  'S10K': 'Secrète 10000',
  'STR': 'Starlight Rare',
  'G': 'Ghost Rare',
  'GG': 'Ghost Gold Rare',
  'QCR': 'Secrète Rare Quart de Siècle',
  'EXS': 'Extra Secrète',
  'RSC': 'Remote Secrète Rare',
  'PHR': 'Pharaonique Rare',
  'COL': "Collector's Rare",
  'UTR': 'Ultimate Rare',
  'PRG': 'Premium Gold Rare',
  'GS': 'Gold Secrète Rare',
  'GLD': 'Gold Rare',
  'SPL': 'Secrète Platinum',
  'SCRB': 'Secret Rare Blasonnée',
  'SCR': 'Secrète Rare',
  'PLA': 'Platinum Rare',
  'PRI': 'Prismatique',
  'PAR': 'Parallèle Rare',
  'UAR': 'Ultra Argent',
  'UVE': 'Ultra Rare Vert',
  'UVI': 'Ultra Rare Violet',
  'URO': 'Ultra Rare Rouge',
  'UBL': 'Ultra Rare Bleu',
  'UB': 'Ultra Blasonnée',
  'UDT': 'Ultra Rare Duel Terminal',
  'U': 'Ultra Rare',
  'SHA': 'Shatterfoil Rare',
  'SFR': 'Starfoil Rare',
  'MO': 'Mosaic Rare',
  'SDT': 'Super Rare Duel Terminal',
  'SR': 'Super Rare',
  'RVI': 'Rare Violet',
  'RVE': 'Rare Vert',
  'RBR': 'Rare Bronze',
  'RBL': 'Rare Bleu',
  'RRO': 'Rare Rouge',
  'RAR': 'Rare Argent',
  'RDT': 'Rare Duel Terminal',
  'R': 'Rare',
  'CDT': 'Commune Duel Terminal',
  'CPA': 'Commune Parallèle',
  'C': 'Commune',
};

// Get rarity full name from code
export function getRarityFullName(rarity: string): string {
  const rarityUpper = rarity.trim();

  // Use explicit mapping if available
  if (CODE_TO_FULL_NAME[rarityUpper]) {
    return CODE_TO_FULL_NAME[rarityUpper];
  }

  // If it's already a full name or unknown, return as is
  return rarityUpper;
}
