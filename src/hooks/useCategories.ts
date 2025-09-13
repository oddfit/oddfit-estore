import { useState, useEffect } from 'react';
import { Category } from '../types';
import { categoriesService } from '../services/firestore';
import { FirebaseError } from 'firebase/app';

type FirestoreDate = Date | { toDate: () => Date } | undefined;
type FirestoreCategory = {
  id: string;
  name: string;
  image_url?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
  launched?: boolean;
};

export const toJsDate = (d: FirestoreDate) =>
  (d && typeof (d as any).toDate === 'function') ? (d as any).toDate() as Date : (d as Date) ?? new Date();

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);

        // If your service supports it, prefer: await categoriesService.getAll({ launched: true })
        const all = (await categoriesService.getAll()) as FirestoreCategory[];

        const transformed: Category[] = all
          .filter(doc => doc?.launched === true)
          .map(doc => ({
            id: doc.id,
            name: doc.name,
            image: doc.image_url ?? '',
            createdAt: toJsDate(doc.createdAt),
            updatedAt: toJsDate(doc.updatedAt),
          }));

        if (alive) {
          setCategories(transformed);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        const code = (err as FirebaseError)?.code ?? (err as any)?.code;
        if (alive) {
          setError(code === 'permission-denied'
            ? 'Categories unavailable - please check Firebase permissions'
            : 'Failed to load categories');
          setCategories([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  return { categories, loading, error };
};
