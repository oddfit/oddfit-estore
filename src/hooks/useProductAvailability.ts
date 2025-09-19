import { useEffect, useState } from 'react';
import { getInventoryForProduct } from '../services/inventory';

// simple in-memory cache so we don't refetch the same product repeatedly
const cache = new Map<string, Record<string, number>>();

export function useProductAvailability(
  productId?: string,
  sizes: string[] = []
) {
  const [stockBySize, setStockBySize] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        let map = cache.get(productId);
        if (!map) {
          map = await getInventoryForProduct(productId);
          cache.set(productId, map);
        }
        if (!alive) return;
        setStockBySize(map);
      } catch (e) {
        console.error('Inventory fetch error:', e);
        if (!alive) return;
        setStockBySize({});
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [productId]);

  const firstInStockSize =
    (sizes || []).find((s) => (stockBySize[s] ?? 0) > 0) || null;

  // if you have products with no sizes, treat any inventory row as "in stock"
  const totalFromSizes = (sizes || []).reduce(
    (sum, s) => sum + (stockBySize[s] ?? 0),
    0
  );
  const anyRowHasStock =
    Object.values(stockBySize).some((v) => v > 0) || totalFromSizes > 0;

  return {
    loading,
    stockBySize,        // size -> qty
    firstInStockSize,   // string | null
    inStock: anyRowHasStock,
  };
}
