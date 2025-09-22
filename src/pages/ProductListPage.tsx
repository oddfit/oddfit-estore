import React, { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ui/ProductCard';
import { productsService } from '../services/firestore';
import type { Product } from '../types';
import Button from '../components/ui/Button';
import { toJsDate } from '../hooks/useCategories';
import { useLocation } from 'react-router-dom'

const FALLBACK =
  'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg';

type AnyProduct = Product & {
  product_name?: string;
  image_url?: string;
  createdAt?: any;
  updatedAt?: any;
};

function normalize(doc: AnyProduct): Product {
  const images = (() => {
    const arr = Array.isArray(doc.images) ? doc.images : [];
    const cleaned = arr
      .map((s: any) => (typeof s === 'string' ? s.trim() : ''))
      .filter(Boolean);
    const single =
      typeof doc.image_url === 'string' && doc.image_url.trim()
        ? [doc.image_url.trim()]
        : [];
    const merged = Array.from(new Set([...cleaned, ...single]));
    return merged.length ? merged : [FALLBACK];
  })();

  return {
    id: doc.id,
    name: (doc.name ?? doc.product_name ?? 'Untitled') as string,
    description: (doc.description ?? '') as string,
    price: Number(doc.price ?? 0),
    images,
    category: (doc.category ?? '') as string,
    sizes: Array.isArray(doc.sizes) ? (doc.sizes as string[]) : [],
    colors: Array.isArray(doc.colors) ? (doc.colors as string[]) : [],
    stock: Number((doc as any).stock ?? 0), // legacy field if present (not used for quick add)
    rating: Number((doc as any).rating ?? 0),
    reviewCount: Number((doc as any).reviewCount ?? 0),
    featured: Boolean((doc as any).featured ?? false),
    createdAt: toJsDate((doc as any).createdAt) || new Date(),
    updatedAt: toJsDate((doc as any).updatedAt) || new Date(),
  };
}

const ProductListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'new' | 'priceAsc' | 'priceDesc'>('new');

  // Read ?category=slug from the URL (e.g. /products?category=kurti)
  const { search } = useLocation();
  const categoryParam = useMemo(() => {
    const v = new URLSearchParams(search).get('category');
    return (v || '').toLowerCase();
  }, [search]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr('');
        setLoading(true);
        const raw = (categoryParam
          ? await productsService.query([
              { field: 'category', operator: '==', value: categoryParam },
            ])
          : await productsService.getAll()) as AnyProduct[];
        const list = raw.map(normalize);
        if (!alive) return;
        setRows(list);
      } catch (e: any) {
        console.error('Load products failed:', e);
        if (!alive) return;
        setErr(e?.message || 'Failed to load products.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [categoryParam]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = rows.filter((p) =>
      q
        ? (p.name || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q)
        : true
    );

    // Enforce category filter from URL on the client too (defensive)
    if (categoryParam) {
       arr = arr.filter(
         (p) => (p.category || '').toLowerCase() === categoryParam
       );
     }

    if (sort === 'new') {
      arr = arr.sort(
        (a, b) =>
          (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)
      );
    } else if (sort === 'priceAsc') {
      arr = arr.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === 'priceDesc') {
      arr = arr.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return arr;
  }, [rows, query, sort]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">All Products</h1>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="flex-1 sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              <option value="new">Newest</option>
              <option value="priceAsc">Price: Low → High</option>
              <option value="priceDesc">Price: High → Low</option>
            </select>
            <Button variant="outline" onClick={() => { setQuery(''); setSort('new'); }}>
              Reset
            </Button>
          </div>
        </div>

        {err && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-gray-600 p-4 bg-white rounded-lg border">
            No products found.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListPage;
