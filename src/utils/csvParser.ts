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
        if (results.errors.length > 0) {
          resolve({
            success: false,
            error: `Erreurs de parsing: ${results.errors.map((e) => e.message).join(', ')}`,
          });
          return;
        }

        const data = results.data as CardRow[];

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

  if (results.errors.length > 0) {
    return {
      success: false,
      error: `Erreurs de parsing: ${results.errors.map((e) => e.message).join(', ')}`,
    };
  }

  const data = results.data as CardRow[];

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
    const response = await fetch('/collection.csv');
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
