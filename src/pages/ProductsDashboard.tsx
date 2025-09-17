// src/pages/ProductsDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Trash2,
  Star,
  PlusCircle,
  RefreshCcw,
  Pencil,
  X,
  Images as ImagesIcon,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { productsService } from '../services/firestore';
import { storage } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCategories } from '../hooks/useCategories';

/* ---------------------------------- Types ---------------------------------- */

type AdminProduct = {
  id: string;
  product_name: string;
  description?: string;
  price: number;
  images?: string[];   // canonical field for multi-images
  image_url?: string;  // for legacy single image
  category?: string;
  sizes?: string[];
  colors?: string[];
  stock?: number;
  featured?: boolean;
  // Extra fields (we'll normalize to snake_case arrays in component state)
  key_features?: string[];
  wash_care?: string[];
  perfect_for?: string[];
  createdAt?: any;
  updatedAt?: any;
};

type NewProductForm = {
  product_name: string;
  price: string; // form string → number on save
  description: string;
  category: string;
  sizes: string[];
  colorsCsv: string;
  stock: string; // form string → number on save
  featured: boolean;
  files: File[]; // images to upload
  // Extra fields as multiline textareas in the form
  keyFeaturesText: string;
  washCareText: string;
  perfectForText: string;
};

/* --------------------------------- Helpers --------------------------------- */

// Convert various shapes (array or single multiline string) into a string[]
function coerceStringArray(val: any): string[] {
  if (Array.isArray(val)) {
    return val.map(String).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof val === 'string') {
    return val
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

// Convert textarea (one item per non-empty line; bullet markers optional) → string[]
function textareaToList(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim().replace(/^[-*•\u2022]\s+/, ''))
    .filter(Boolean);
}

// Simple CSV parser for colors
function parseCsv(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

// Upload selected images to Storage, return download URLs
async function uploadProductFiles(files: File[]): Promise<string[]> {
  const uploads = files.map(async (file) => {
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name}`;
    const path = `products/${safeName}`;
    const r = ref(storage, path);
    await uploadBytes(r, file);
    return await getDownloadURL(r);
  });
  return Promise.all(uploads);
}

/* --------------------------------- Component -------------------------------- */

const emptyNewForm: NewProductForm = {
  product_name: '',
  price: '',
  description: '',
  category: '',
  sizes: [],
  colorsCsv: '',
  stock: '',
  featured: false,
  files: [],
  keyFeaturesText: '',
  washCareText: '',
  perfectForText: '',
};

const ProductsDashboard: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<NewProductForm>(emptyNewForm);

  // Edit state
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSizes, setEditSizes] = useState<string[]>([]);
  const [editColorsCsv, setEditColorsCsv] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editFeatured, setEditFeatured] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  // Extra fields in Edit (as textareas)
  const [editKeyFeaturesText, setEditKeyFeaturesText] = useState('');
  const [editWashCareText, setEditWashCareText] = useState('');
  const [editPerfectForText, setEditPerfectForText] = useState('');

  const { categories, loading: catsLoading } = useCategories();

  const catOptions = useMemo(() => categories, [categories]);
  const currentAddCat = useMemo(
    () => catOptions.find((c) => c.id === form.category),
    [catOptions, form.category]
  );
  const currentEditCat = useMemo(
    () => catOptions.find((c) => c.id === editCategory),
    [catOptions, editCategory]
  );

  const addCatSizes = currentAddCat?.sizes ?? [];
  const editCatSizes = currentEditCat?.sizes ?? [];

  /* ------------------------------ Fetch products ----------------------------- */

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setFetchErr('');
      const rows = await productsService.getAll();

      setProducts(
        rows.map((r: any) => {
          // normalize extra fields regardless of old/new naming
          const keyFeatures = coerceStringArray(r.key_features ?? r.keyFeatures);
          const washCare = coerceStringArray(r.wash_care ?? r.washCare);
          const perfectFor = coerceStringArray(r.perfect_for ?? r.perfectFor);

          // normalize colors
          let colors: string[] = [];
          if (Array.isArray(r.colors)) {
            colors = r.colors.map(String).map((s: string) => s.trim()).filter(Boolean);
          } else if (typeof r.colors === 'string') {
            colors = parseCsv(r.colors);
          }

          return {
            id: r.id,
            product_name: r.product_name ?? r.name ?? '',
            description: r.description ?? '',
            price: Number(r.price ?? 0),
            images: Array.isArray(r.images)
              ? r.images
              : r.image_url
              ? [String(r.image_url)]
              : [],
            image_url: r.image_url ?? null,
            category: r.category ?? '',
            sizes: Array.isArray(r.sizes) ? r.sizes : [],
            colors,
            stock: Number(r.stock ?? 0),
            featured: Boolean(r.featured),
            key_features: keyFeatures,
            wash_care: washCare,
            perfect_for: perfectFor,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          } as AdminProduct;
        })
      );
    } catch (e: any) {
      console.error('Fetch products failed:', e);
      setFetchErr(e?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /* ------------------------------- Add product ------------------------------- */

  const onAddChange = (key: keyof NewProductForm, val: string | boolean | File[]) => {
    setForm((f) => ({ ...f, [key]: val as any }));
  };

  const handleAddFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    onAddChange('files', [...form.files, ...files]);
    e.currentTarget.value = '';
  };

  const handleAddRemoveFile = (idx: number) => {
    setForm((f) => ({ ...f, files: f.files.filter((_, i) => i !== idx) }));
  };

  const handleAddSizesToggle = (size: string) => {
    setForm((f) => {
      const exists = f.sizes.includes(size);
      return { ...f, sizes: exists ? f.sizes.filter((s) => s !== size) : [...f.sizes, size] };
    });
  };

  const handleAddSizesSelectAll = () => {
    onAddChange('sizes', addCatSizes);
  };
  const handleAddSizesClear = () => {
    onAddChange('sizes', []);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const priceNum = Number(form.price);
    const stockNum = form.stock ? Number(form.stock) : 0;

    if (!form.product_name.trim()) return alert('Product name is required.');
    if (Number.isNaN(priceNum) || priceNum < 0) return alert('Enter a valid price.');
    if (!form.category) return alert('Please select a category.');
    if (form.files.length === 0) return alert('Please select at least one image.');

    try {
      setSubmitting(true);
      // 1) Upload images
      const urls = await uploadProductFiles(form.files);

      // 2) Build payload (extra fields as arrays)
      const payload = {
        product_name: form.product_name.trim(),
        description: form.description.trim(),
        price: priceNum,
        category: form.category,
        sizes: form.sizes,
        colors: parseCsv(form.colorsCsv),
        stock: Number.isNaN(stockNum) ? 0 : stockNum,
        featured: !!form.featured,
        images: urls,             // canonical multi-image
        image_url: urls[0] || '', // legacy convenience
        key_features: textareaToList(form.keyFeaturesText),
        wash_care: textareaToList(form.washCareText),
        perfect_for: textareaToList(form.perfectForText),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await productsService.create(payload);
      setAddOpen(false);
      setForm(emptyNewForm);
      await fetchProducts();
    } catch (e: any) {
      console.error('Create product failed:', e);
      alert(
        e?.code === 'permission-denied'
          ? 'Permission denied. Your account is not allowed to modify products.'
          : e?.message || 'Failed to add product.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* --------------------------------- Edit modal -------------------------------- */

  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    setEditName(p.product_name || '');
    setEditPrice(String(p.price ?? ''));
    setEditDesc(p.description || '');
    setEditCategory(p.category || '');
    setEditSizes(Array.isArray(p.sizes) ? p.sizes : []);
    setEditColorsCsv(Array.isArray(p.colors) ? p.colors.join(', ') : '');
    setEditStock(String(p.stock ?? ''));
    setEditFeatured(!!p.featured);
    setExistingImages(Array.isArray(p.images) ? [...p.images] : p.image_url ? [p.image_url] : []);
    setNewFiles([]);

    // Seed extra fields textareas (one item per line)
    setEditKeyFeaturesText((p.key_features || []).join('\n'));
    setEditWashCareText((p.wash_care || []).join('\n'));
    setEditPerfectForText((p.perfect_for || []).join('\n'));

    setEditOpen(true);
  };

  const handleEditRemoveExistingImage = (index: number) => {
    setExistingImages((arr) => arr.filter((_, i) => i !== index));
  };

  const handleEditAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    setNewFiles((curr) => [...curr, ...files]);
    e.currentTarget.value = '';
  };

  const handleEditRemoveNewFile = (idx: number) => {
    setNewFiles((curr) => curr.filter((_, i) => i !== idx));
  };

  const handleEditSizesToggle = (size: string) => {
    setEditSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  };
  const handleEditSizesSelectAll = () => setEditSizes(editCatSizes);
  const handleEditSizesClear = () => setEditSizes([]);

  const handleUpdate = async () => {
    if (!editing) return;

    const priceNum = Number(editPrice);
    const stockNum = editStock ? Number(editStock) : 0;
    if (!editName.trim()) return alert('Product name is required.');
    if (Number.isNaN(priceNum) || priceNum < 0) return alert('Enter a valid price.');
    if (!editCategory) return alert('Please select a category.');

    try {
      setSubmitting(true);

      // Upload any new images, then merge with existing
      const newUrls = newFiles.length ? await uploadProductFiles(newFiles) : [];
      const mergedImages: string[] = [
        ...(Array.isArray(existingImages) ? existingImages : []),
        ...newUrls,
      ];

      // Build update payload (flat arrays only)
      const payload: Partial<AdminProduct> = {
        product_name: editName.trim(),
        description: editDesc.trim(),
        price: priceNum,
        category: editCategory,
        sizes: editSizes,
        colors: parseCsv(editColorsCsv),
        stock: Number.isNaN(stockNum) ? 0 : stockNum,
        featured: !!editFeatured,
        images: mergedImages,
        image_url: mergedImages[0] || '',
        key_features: textareaToList(editKeyFeaturesText),
        wash_care: textareaToList(editWashCareText),
        perfect_for: textareaToList(editPerfectForText),
        updatedAt: new Date(),
      };

      await productsService.update(editing.id, payload);
      setEditOpen(false);
      setEditing(null);
      await fetchProducts();
    } catch (e: any) {
      console.error('Update failed:', e);
      alert(
        e?.code === 'permission-denied'
          ? 'Permission denied.'
          : e?.message || 'Update failed.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    if (!confirm('Delete this product?')) return;
    try {
      await productsService.delete(editing.id);
      setEditOpen(false);
      setEditing(null);
      await fetchProducts();
    } catch (e: any) {
      console.error('Delete failed:', e);
      alert(
        e?.code === 'permission-denied'
          ? 'Permission denied.'
          : e?.message || 'Delete failed.'
      );
    }
  };

  /* --------------------------------- Render --------------------------------- */

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchProducts}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {fetchErr && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {fetchErr}
        </div>
      )}

      {/* Products grid (read-only; edit via button) */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />
            Loading…
          </div>
        ) : products.length === 0 ? (
          <div className="text-sm text-gray-500 p-4">No products yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => {
              const first = p.images?.[0] || p.image_url || '';
              const count = p.images?.length ?? (p.image_url ? 1 : 0);
              return (
                <div
                  key={p.id}
                  className="rounded-lg border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-square bg-gray-100">
                    {first ? (
                      <img
                        src={first}
                        alt={p.product_name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImagesIcon className="h-10 w-10" />
                      </div>
                    )}
                    {count > 1 && (
                      <span className="absolute bottom-2 right-2 text-xs px-2 py-1 rounded bg-black/70 text-white">
                        {count} images
                      </span>
                    )}
                    {p.featured && (
                      <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                        <Star className="h-3.5 w-3.5 fill-yellow-500" /> Featured
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-medium text-gray-900 line-clamp-2">{p.product_name}</div>
                    <div className="text-sm text-gray-600 mt-1">{p.category || '—'}</div>
                    <div className="mt-2 font-semibold">₹{Number(p.price ?? 0).toFixed(2)}</div>

                    {/* Mini preview of extra fields (optional) */}
                    {(p.key_features?.length || p.wash_care?.length || p.perfect_for?.length) ? (
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        {p.key_features?.length ? (
                          <div><span className="font-semibold">Key:</span> {p.key_features.slice(0, 2).join(' • ')}{(p.key_features.length > 2) ? '…' : ''}</div>
                        ) : null}
                        {p.wash_care?.length ? (
                          <div><span className="font-semibold">Care:</span> {p.wash_care.slice(0, 2).join(' • ')}{(p.wash_care.length > 2) ? '…' : ''}</div>
                        ) : null}
                        {p.perfect_for?.length ? (
                          <div><span className="font-semibold">For:</span> {p.perfect_for.slice(0, 2).join(' • ')}{(p.perfect_for.length > 2) ? '…' : ''}</div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-3 flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Product">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Product Name"
            value={form.product_name}
            onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
            required
          />
          <Input
            label="Price (₹)"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            required
          />
          <Input
            label="Stock"
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
          />

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category: e.target.value,
                  sizes: [], // reset sizes when category changes
                }))
              }
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select category</option>
              {catsLoading ? (
                <option disabled>Loading…</option>
              ) : (
                catOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Sizes from category */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Sizes</label>
              <div className="text-xs text-gray-600 flex gap-3">
                <button type="button" onClick={handleAddSizesSelectAll} className="underline">
                  Select all
                </button>
                <button type="button" onClick={handleAddSizesClear} className="underline">
                  Clear
                </button>
              </div>
            </div>
            {form.category ? (
              addCatSizes.length ? (
                <div className="flex flex-wrap gap-2">
                  {addCatSizes.map((sz) => {
                    const active = form.sizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleAddSizesToggle(sz)}
                        className={`px-3 py-1 rounded border text-sm ${
                          active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-gray-500">No sizes configured for this category.</div>
              )
            ) : (
              <div className="text-xs text-gray-500">Select a category first.</div>
            )}
          </div>

          <Input
            label="Colors (comma separated)"
            placeholder="Black, White"
            value={form.colorsCsv}
            onChange={(e) => setForm((f) => ({ ...f, colorsCsv: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Optional details…"
            />
          </div>

          {/* Extra fields (multiline) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key features</label>
            <textarea
              value={form.keyFeaturesText}
              onChange={(e) => setForm((f) => ({ ...f, keyFeaturesText: e.target.value }))}
              rows={4}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={`One per line, e.g.\nFront pleats for umbrella-fit\nPlain back with A-line finish`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wash care</label>
            <textarea
              value={form.washCareText}
              onChange={(e) => setForm((f) => ({ ...f, washCareText: e.target.value }))}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={`One per line, e.g.\nMachine wash cold\nDo not bleach`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Perfect for</label>
            <textarea
              value={form.perfectForText}
              onChange={(e) => setForm((f) => ({ ...f, perfectForText: e.target.value }))}
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={`One per line, e.g.\nOffice wear\nFestive occasions`}
            />
          </div>

          {/* Image files */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
            <input type="file" accept="image/*" multiple onChange={handleAddFileInput} />
            {form.files.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                {form.files.map((f, i) => {
                  const preview = URL.createObjectURL(f);
                  return (
                    <div key={`${f.name}-${i}`} className="relative group">
                      <img
                        src={preview}
                        alt={f.name}
                        className="h-24 w-full object-cover rounded border"
                        onLoad={() => URL.revokeObjectURL(preview)}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddRemoveFile(i)}
                        className="absolute top-1 right-1 bg-white/90 rounded p-1 shadow hover:bg-white"
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Mark as featured</span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={submitting}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setForm(emptyNewForm)}
              disabled={submitting}
            >
              Clear
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        title="Edit Product"
      >
        {!editing ? null : (
          <div className="space-y-4">
            <Input label="Product Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            <Input label="Price (₹)" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required />
            <Input label="Stock" value={editStock} onChange={(e) => setEditStock(e.target.value)} />

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={editCategory}
                onChange={(e) => {
                  setEditCategory(e.target.value);
                  setEditSizes([]); // reset sizes on category change
                }}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                {catsLoading ? (
                  <option disabled>Loading…</option>
                ) : (
                  catOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Sizes from category */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Sizes</label>
                <div className="text-xs text-gray-600 flex gap-3">
                  <button type="button" onClick={handleEditSizesSelectAll} className="underline">
                    Select all
                  </button>
                  <button type="button" onClick={handleEditSizesClear} className="underline">
                    Clear
                  </button>
                </div>
              </div>
              {editCategory ? (
                editCatSizes.length ? (
                  <div className="flex flex-wrap gap-2">
                    {editCatSizes.map((sz) => {
                      const active = editSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleEditSizesToggle(sz)}
                          className={`px-3 py-1 rounded border text-sm ${
                            active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No sizes configured for this category.</div>
                )
              ) : (
                <div className="text-xs text-gray-500">Select a category first.</div>
              )}
            </div>

            <Input
              label="Colors (comma separated)"
              placeholder="Black, White"
              value={editColorsCsv}
              onChange={(e) => setEditColorsCsv(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={4}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Optional details…"
              />
            </div>

            {/* Extra fields (multiline) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key features</label>
              <textarea
                value={editKeyFeaturesText}
                onChange={(e) => setEditKeyFeaturesText(e.target.value)}
                rows={4}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={`One per line, e.g.\nFront pleats for umbrella-fit\nPlain back with A-line finish`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wash care</label>
              <textarea
                value={editWashCareText}
                onChange={(e) => setEditWashCareText(e.target.value)}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={`One per line, e.g.\nMachine wash cold\nDo not bleach`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perfect for</label>
              <textarea
                value={editPerfectForText}
                onChange={(e) => setEditPerfectForText(e.target.value)}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={`One per line, e.g.\nOffice wear\nFestive occasions`}
              />
            </div>

            {/* Existing images */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                <span className="text-xs text-gray-500">
                  {existingImages.length + newFiles.length} selected
                </span>
              </div>

              {existingImages.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {existingImages.map((url, i) => (
                    <div key={`${url}-${i}`} className="relative group">
                      <img src={url} alt={`image-${i}`} className="h-24 w-full object-cover rounded border" />
                      <button
                        type="button"
                        onClick={() => handleEditRemoveExistingImage(i)}
                        className="absolute top-1 right-1 bg-white/90 rounded p-1 shadow hover:bg-white"
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500 mb-2">No images yet.</div>
              )}

              {/* Add new files */}
              <div className="mt-3">
                <input type="file" accept="image/*" multiple onChange={handleEditAddFiles} />
                {newFiles.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {newFiles.map((f, i) => {
                      const preview = URL.createObjectURL(f);
                      return (
                        <div key={`${f.name}-${i}`} className="relative group">
                          <img
                            src={preview}
                            alt={f.name}
                            className="h-24 w-full object-cover rounded border"
                            onLoad={() => URL.revokeObjectURL(preview)}
                          />
                          <button
                            type="button"
                            onClick={() => handleEditRemoveNewFile(i)}
                            className="absolute top-1 right-1 bg-white/90 rounded p-1 shadow hover:bg-white"
                            title="Remove"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={editFeatured}
                onChange={(e) => setEditFeatured(e.target.checked)}
              />
              <span className="text-sm text-gray-700">Mark as featured</span>
            </label>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleUpdate} loading={submitting}>
                Save Changes
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={submitting}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  setEditing(null);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductsDashboard;
