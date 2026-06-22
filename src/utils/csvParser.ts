import Papa from 'papaparse';
import { CardRow } from '../types';

export interface ParseResult {
  success: boolean;
  data?: CardRow[];
  error?: string;
}

/**
 * Parse CSV file and return CardRow array
 */
export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transform: (value, field) => {
        // Convert Quantité to number
        if (field === 'Quantité') {
          const num = parseInt(value, 10);
          return isNaN(num) ? 0 : num;
        }
        return value;
      },
      complete: (results) => {
        const data = results.data as CardRow[];

        // Per-row issues (ragged lines, extra fields) shouldn't discard the
        // whole collection — warn but keep going. Only fail with no usable data.
        if (results.errors.length > 0) {
          console.warn('Avertissements de parsing CSV:', results.errors.map((e) => e.message));
        }
        if (data.length === 0) {
          resolve({
            success: false,
            error: 'Fichier CSV vide ou illisible',
          });
          return;
        }

        // Validate that we have the required columns
        if (data.length > 0) {
          const firstRow = data[0];
          const requiredFields = [
            'Langue',
            'Extension',
            'Code',
            'Nom de la carte',
            'Rareté',
            'Quantité',
          ];

          const missingFields = requiredFields.filter(
            (field) => !(field in firstRow)
          );

          if (missingFields.length > 0) {
            resolve({
              success: false,
              error: `Colonnes manquantes: ${missingFields.join(', ')}`,
            });
            return;
          }
        }

        resolve({
          success: true,
          data,
        });
      },
      error: (error) => {
        resolve({
          success: false,
          error: `Erreur lors de la lecture du fichier: ${error.message}`,
        });
      },
    });
  });
}

/**
 * Parse CSV from text content
 */
export function parseCSVText(csvText: string): ParseResult {
  const results = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transform: (value, field) => {
      // Convert Quantité to number
      if (field === 'Quantité') {
        const num = parseInt(value, 10);
        return isNaN(num) ? 0 : num;
      }
      return value;
    },
  });

  const data = results.data as CardRow[];

  // Per-row issues shouldn't discard the whole collection — warn but keep going.
  if (results.errors.length > 0) {
    console.warn('Avertissements de parsing CSV:', results.errors.map((e) => e.message));
  }
  if (data.length === 0) {
    return {
      success: false,
      error: 'Fichier CSV vide ou illisible',
    };
  }

  // Validate that we have the required columns
  if (data.length > 0) {
    const firstRow = data[0];
    const requiredFields = [
      'Langue',
      'Extension',
      'Code',
      'Nom de la carte',
      'Rareté',
      'Quantité',
    ];

    const missingFields = requiredFields.filter((field) => !(field in firstRow));

    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Colonnes manquantes: ${missingFields.join(', ')}`,
      };
    }
  }

  return {
    success: true,
    data,
  };
}

/**
 * Load CSV from default file path
 */
export async function loadDefaultCSV(): Promise<ParseResult> {
  try {
    const response = await fetch('/yugioh/collection.csv');
    if (!response.ok) {
      return {
        success: false,
        error: `Erreur de chargement du fichier: ${response.statusText}`,
      };
    }

    const text = await response.text();
    return parseCSVText(text);
  } catch (error) {
    return {
      success: false,
      error: `Erreur de chargement: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
