import React, { useEffect, useMemo, useState } from 'react';
import { Save, Trash2, Pencil, RefreshCcw } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { productsService } from '../services/firestore';
import { getByProduct, upsert, removeInventory } from '../services/inventory';
import { toJsDate } from '../hooks/useCategories';

type ProductMeta = {
  id: string;
  name: string;
  sizes: string[];
};

type Row = {
  productId: string;
  size: string;
  stock: number;
  updatedAt?: Date | null;
};

const canonicalizeSizes = (raw: any): string[] => {
  // Accept a variety of field shapes and normalize
  let arr: string[] = [];
  if (Array.isArray(raw)) arr = raw;
  // fallback keys commonly used
  if (!arr.length && Array.isArray((raw as any)?.sizes)) arr = (raw as any).sizes;
  if (!arr.length && Array.isArray((raw as any)?.sizeOptions)) arr = (raw as any).sizeOptions;
  if (!arr.length && Array.isArray((raw as any)?.size)) arr = (raw as any).size;

  return arr
    .map((s: any) => String(s ?? '').trim())
    .filter(Boolean);
};

const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const orderIndex = (s: string) => {
  const i = sizeOrder.indexOf(s.toUpperCase());
  return i === -1 ? 999 : i;
};

const AdminInventory: React.FC = () => {
  const [products, setProducts] = useState<ProductMeta[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // form state
  const [form, setForm] = useState<{ size: string; qty: number }>({ size: '', qty: 0 });
  const [editing, setEditing] = useState<{ size: string } | null>(null);

  const selectedProduct: ProductMeta | undefined = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const availableSizes = selectedProduct?.sizes ?? [];

  const sortedRows = useMemo(() => {
    // Prefer product’s declared size order if present; otherwise fallback to canonical order
    if (availableSizes.length) {
      const index = (s: string) => {
        const i = availableSizes.indexOf(s);
        return i === -1 ? 999 : i;
      };
      return [...rows].sort((a, b) => index(a.size) - index(b.size));
    }
    return [...rows].sort((a, b) => orderIndex(a.size) - orderIndex(b.size));
  }, [rows, availableSizes]);

  // load product list
  useEffect(() => {
    (async () => {
      setErr('');
      try {
        const list = await productsService.getAll();
        const mapped: ProductMeta[] = (list as any[]).map((p) => ({
          id: p.id,
          name: p.product_name || p.name || p.id,
          sizes: canonicalizeSizes(p.sizes ?? p.sizeOptions ?? p.size ?? []),
        }));
        console.debug('[AdminInventory] products loaded', mapped.length);
        setProducts(mapped);

        // default to first product
        if (!selectedProductId && mapped[0]) {
          setSelectedProductId(mapped[0].id);
        }
      } catch (e: any) {
        console.error('[AdminInventory] load products error', e);
        setErr(e?.message || 'Failed to load products.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load rows for selected product
  const loadRows = async (pid: string) => {
    if (!pid) return;
    try {
      setLoading(true);
      setErr('');
      console.debug('[AdminInventory] loadRows', { productId: pid });
      const r = await getByProduct(pid);
      const mapped: Row[] = r.map((x) => ({
        productId: x.productId,
        size: x.size,
        stock: Number(x.stock || 0),
        updatedAt: toJsDate(x.updatedAt) || null,
      }));
      console.debug('[AdminInventory] rows loaded', mapped.length);
      setRows(mapped);
    } catch (e: any) {
      console.error('[AdminInventory] loadRows error', e);
      setErr(e?.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  // when product changes: load rows + preselect first size (if not editing)
  useEffect(() => {
    if (!selectedProductId) return;
    loadRows(selectedProductId).then(() => {
      if (!editing) {
        const first = availableSizes[0] ?? '';
        setForm((f) => ({ ...f, size: first }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId, availableSizes.length]);

  const onSave = async () => {
    if (!selectedProductId) {
      alert('Please select a product.');
      return;
    }
    if (!form.size.trim()) {
      alert(
        availableSizes.length
          ? 'Please choose a size from the list.'
          : 'This product has no sizes defined. Add sizes to the product first.'
      );
      return;
    }
    try {
      console.debug('[AdminInventory] save', {
        productId: selectedProductId,
        size: form.size,
        qty: Number(form.qty || 0),
      });
      await upsert({
        productId: selectedProductId,
        size: form.size.trim(),
        qty: Number(form.qty || 0),
      });
      await loadRows(selectedProductId);
      setForm({ size: availableSizes[0] ?? '', qty: 0 });
      setEditing(null);
    } catch (e: any) {
      console.error('[AdminInventory] save error', e);
      alert(e?.message || 'Failed to save inventory.');
    }
  };

  const onEdit = (size: string, stock: number) => {
    setEditing({ size });
    setForm({ size, qty: Number(stock || 0) });
  };

  const onDelete = async (size: string) => {
    if (!selectedProductId) return;
    if (!confirm(`Delete inventory for size "${size}"?`)) return;
    try {
      console.debug('[AdminInventory] delete', { productId: selectedProductId, size });
      await removeInventory(selectedProductId, size);
      await loadRows(selectedProductId);
      if (editing?.size === size) {
        setEditing(null);
        setForm({ size: availableSizes[0] ?? '', qty: 0 });
      }
    } catch (e: any) {
      console.error('[AdminInventory] delete error', e);
      alert(e?.message || 'Failed to delete inventory.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Button variant="outline" onClick={() => selectedProductId && loadRows(selectedProductId)}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {err && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Product picker */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
        <select
          value={selectedProductId}
          onChange={(e) => {
            setEditing(null);
            setSelectedProductId(e.target.value);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name || ('Untitled')}
            </option>
          ))}
        </select>
        {availableSizes.length === 0 && (
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 inline-block px-2 py-1 rounded">
            This product has no sizes configured. Add sizes to the product to enable inventory by size.
          </p>
        )}
      </div>

      {/* Add / Edit form */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Size dropdown populated from product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
            <select
              value={form.size}
              onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
              disabled={editing !== null /* keep id stable while editing */}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
            >
              {availableSizes.length === 0 ? (
                <option value="">No sizes</option>
              ) : (
                availableSizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))
              )}
            </select>
            {editing && (
              <p className="mt-1 text-xs text-gray-500">
                Size can’t be changed while editing. Delete and re-add if you need a different size.
              </p>
            )}
          </div>

          {/* Quantity */}
          <Input
            label="Quantity"
            type="number"
            value={String(form.qty)}
            onChange={(e) => setForm((f) => ({ ...f, qty: Number(e.target.value) }))}
            required
          />

          {/* Save */}
          <div className="flex items-end">
            <Button
              onClick={onSave}
              className="w-full"
              disabled={availableSizes.length === 0 || !form.size}
            >
              <Save className="h-4 w-4 mr-2" />
              {editing ? 'Update' : 'Add'}
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border p-4">
        {loading ? (
          <div className="text-sm text-gray-600">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-600">No inventory rows for this product yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-2">Size</th>
                <th className="py-2 pr-2 text-right">Stock</th>
                <th className="py-2 pr-2">Updated</th>
                <th className="py-2 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r) => (
                <tr key={r.size} className="border-b last:border-0">
                  <td className="py-2 pr-2">{r.size}</td>
                  <td className="py-2 pr-2 text-right font-medium">{r.stock}</td>
                  <td className="py-2 pr-2">{r.updatedAt ? r.updatedAt.toLocaleString() : '—'}</td>
                  <td className="py-2 pr-2 text-right">
                    <div className="inline-flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(r.size, r.stock)}>
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => onDelete(r.size)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminInventory;