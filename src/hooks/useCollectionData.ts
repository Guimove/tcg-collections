import { useState, useEffect } from 'react';
import Papa from 'papaparse';

interface UseCollectionDataOptions {
  header?: boolean;
  delimiter?: string;
  transformHeader?: (header: string) => string;
}

interface UseCollectionDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export function useCollectionData<T>(
  csvPath: string,
  transformRows: (rows: any[]) => T[],
  options: UseCollectionDataOptions = {},
): UseCollectionDataResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(csvPath);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${csvPath}`);
        }
        const text = await response.text();

        const results = Papa.parse(text, {
          header: options.header ?? true,
          skipEmptyLines: true,
          delimiter: options.delimiter ?? '',
          ...(options.transformHeader && { transformHeader: options.transformHeader }),
        });

        if (results.errors.length > 0) {
          if (!cancelled) {
            setError(`Erreur lors du parsing du CSV: ${results.errors[0].message}`);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setData(transformRows(results.data as any[]));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(`Erreur lors du chargement: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [csvPath]);

  return { data, loading, error };
}
