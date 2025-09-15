// src/hooks/useCategories.ts
import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '../services/firebase';

export type Category = {
  id: string;
  name: string;
  image: string;       // normalized single image URL your UI expects
  sizes: string[];     // array of size labels
  launched?: boolean;  // optional flag
  createdAt?: Date;
  updatedAt?: Date;
};

// Helper you used elsewhere
export const toJsDate = (val: any): Date | undefined => {
  if (!val) return undefined;
  if (typeof val?.toDate === 'function') return val.toDate();
  if (val instanceof Date) return val;
  return undefined;
};

type RawCategory = DocumentData & {
  name?: string;
  image_url?: string | null;
  sizes?: string[] | null;
  launched?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

export function useCategories(opts?: { onlyLaunched?: boolean }) {
  const onlyLaunched = opts?.onlyLaunched ?? true;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        // Single fetch, no where/orderBy to avoid index issues
        const snap = await getDocs(collection(db, 'categories'));

        const all = snap.docs.map((d) => {
          const data = (d.data() || {}) as RawCategory;

          // Normalize an image URL for the UI
          const normalizedImage =
            (typeof data.image_url === 'string' && data.image_url) ||
            '';

          return {
            id: d.id,
            name: data.name ?? '',
            image: normalizedImage,
            sizes: Array.isArray(data.sizes) ? data.sizes : [],
            launched: data.launched === true,
            createdAt: toJsDate(data.createdAt),
            updatedAt: toJsDate(data.updatedAt),
          } as Category;
        });

        // Filter by launched on the client
        let filtered = onlyLaunched ? all.filter((c) => c.launched) : all;

        // If nothing matched and we do have categories, fall back so UI isn’t empty
        if (onlyLaunched && filtered.length === 0 && all.length > 0) {
          console.warn(
            '[useCategories] No categories with launched=true. Falling back to showing all.'
          );
          filtered = all;
        }

        // Sort by name
        filtered.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

        if (alive) setCategories(filtered);
      } catch (e: any) {
        console.error('useCategories error:', e);
        if (alive) setError(e?.message || 'Failed to load categories.');
        if (alive) setCategories([]); // keep it safe
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [onlyLaunched]);

  // In case you want memoized values (optional)
  const value = useMemo(
    () => ({ categories, loading, error }),
    [categories, loading, error]
  );

  return value;
}
