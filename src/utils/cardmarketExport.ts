import { ProcessedCardVersion } from '../types';

// Cardmarket condition mapping from ScanFlip abbreviations
const CONDITION_MAP: Record<string, string> = {
  'NM': 'Near Mint',
  'PL': 'Lightly Played',
  'GD': 'Good',
  'PO': 'Poor',
};

// Language mapping from ScanFlip to Cardmarket
const LANGUAGE_MAP: Record<string, string> = {
  'Français (France)': 'French',
  'Français (Canada)': 'French',
  'Anglais (Europe)': 'English',
  'Anglais (US)': 'English',
  'Anglais (Monde)': 'English',
  'Espagnol': 'Spanish',
  'Allemand': 'German',
  'Italien': 'Italian',
  'Portugais': 'Portuguese',
  'Japonais': 'Japanese',
  'Coréen': 'Korean',
  'Chinois': 'Chinese',
};

function getEditionAndCondition(item: ProcessedCardVersion): { edition: string; condition: string } {
  if (item['1st Edition'] && item['1st Edition'].trim()) {
    return { edition: 'Yes', condition: CONDITION_MAP[item['1st Edition'].trim()] || 'Near Mint' };
  }
  if (item['Unlimited'] && item['Unlimited'].trim()) {
    return { edition: '', condition: CONDITION_MAP[item['Unlimited'].trim()] || 'Near Mint' };
  }
  if (item['Limited / Autre'] && item['Limited / Autre'].trim()) {
    return { edition: '', condition: CONDITION_MAP[item['Limited / Autre'].trim()] || 'Near Mint' };
  }
  return { edition: '', condition: 'Near Mint' };
}

function escapeCSVField(value: string): string {
  if (value.includes('"') || value.includes(';') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return `"${value}"`;
}

function downloadCSV(content: string, filename: string) {
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Export Yu-Gi-Oh cards for sale in Cardmarket stock import format
 * Format: semicolon-delimited CSV
 * Columns: Amount;Name;Expansion;Card Number;Condition;Language;Is First Edition;Is Signed;Is Altered;Is Playset;Price
 */
export function exportYugiohForCardmarket(items: ProcessedCardVersion[]) {
  const header = '"Amount";"Name";"Expansion";"Card Number";"Rarity";"Condition";"Language";"Is First Edition";"Is Signed";"Is Altered";"Is Playset";"Price"';

  const rows = items
    .filter(item => item.toSell > 0)
    .map(item => {
      const { edition, condition } = getEditionAndCondition(item);
      const language = LANGUAGE_MAP[item.Langue] || 'French';
      return [
        escapeCSVField(String(item.toSell)),
        escapeCSVField(item['Nom de la carte']),
        escapeCSVField(item.Extension),
        escapeCSVField(item.Code),
        escapeCSVField(item.Rareté),
        escapeCSVField(condition),
        escapeCSVField(language),
        escapeCSVField(edition),
        '""', // Is Signed
        '""', // Is Altered
        '""', // Is Playset
        '""', // Price
      ].join(';');
    });

  const content = [header, ...rows].join('\n');
  downloadCSV(content, `yugioh-cardmarket-${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Export simple TCG cards for sale in Cardmarket stock import format
 * Used for Riftbound, Lorcana, and similar TCGs
 */
interface SimpleCardForExport {
  name: string;
  set: string;
  cardId: string;
  rarity: string;
  quantity: number;
}

export function exportSimpleForCardmarket(
  items: SimpleCardForExport[],
  tcgName: string,
) {
  const header = '"Amount";"Name";"Expansion";"Card Number";"Rarity";"Condition";"Language";"Is First Edition";"Price"';

  const rows = items
    .filter(item => item.quantity >= 2)
    .map(item => {
      const toSell = item.quantity - 1;
      return [
        escapeCSVField(String(toSell)),
        escapeCSVField(item.name),
        escapeCSVField(item.set),
        escapeCSVField(item.cardId),
        escapeCSVField(item.rarity),
        escapeCSVField('Near Mint'),
        escapeCSVField('French'),
        '""', // Is First Edition
        '""', // Price
      ].join(';');
    });

  const content = [header, ...rows].join('\n');
  const slug = tcgName.toLowerCase().replace(/\s+/g, '-');
  downloadCSV(content, `${slug}-cardmarket-${new Date().toISOString().slice(0, 10)}.csv`);
}
