import React, { useEffect, useMemo, useState } from 'react';
import { PlusCircle, RefreshCcw, Pencil, Trash2, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { AdminCategoriesService } from '../services/firestore';

type Category = {
  id: string;
  name: string;
  image_url?: string;
  sizes?: string[];
  launched?: boolean;
  location?: string; // if you have this
  createdAt?: any;
  updatedAt?: any;
};

const emptyForm = { name: '', image_url: '', sizesCsv: '', launched: false, location: '' };

const AdminCategories: React.FC = () => {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const parseCsv = (s: string) =>
    s.split(',').map((x) => x.trim()).filter(Boolean);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setErr('');
      const data = await AdminCategoriesService.getAll();
      setRows(
        data.map((c: any) => ({
          id: c.id,
          name: c.name ?? '',
          image_url: c.image_url ?? '',
          sizes: Array.isArray(c.sizes) ? c.sizes : parseCsv(c.sizes ?? ''),
          launched: !!c.launched,
          location: c.location ?? '',
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }))
      );
    } catch (e: any) {
      setErr(e?.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openEdit = (c: Category) => {
    setEditing(c);
    setEditForm({
      name: c.name || '',
      image_url: c.image_url || '',
      sizesCsv: (c.sizes || []).join(', '),
      launched: !!c.launched,
      location: c.location || '',
    } as any);
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Category name is required.');

    try {
      await AdminCategoriesService.create({
        name: form.name.trim(),
        image_url: form.image_url.trim(),
        sizes: parseCsv(form.sizesCsv),
        launched: !!form.launched,
        location: form.location.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setAddOpen(false);
      setForm(emptyForm);
      await fetchAll();
    } catch (e: any) {
      alert(e?.message || 'Create failed.');
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await AdminCategoriesService.update(editing.id, {
        name: editForm.name.trim(),
        image_url: editForm.image_url.trim(),
        sizes: parseCsv(editForm.sizesCsv),
        launched: !!editForm.launched,
        location: editForm.location.trim(),
        updatedAt: new Date(),
      });
      setEditOpen(false);
      setEditing(null);
      await fetchAll();
    } catch (e: any) {
      alert(e?.message || 'Update failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await AdminCategoriesService.delete(id);
      await fetchAll();
    } catch (e: any) {
      alert(e?.message || 'Delete failed.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchAll}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" /> Add Category
          </Button>
        </div>
      </div>

      {err && <div className="mb-4 border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{err}</div>}

      <div className="bg-white rounded-lg shadow-sm p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-500">No categories yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rows.map((c) => (
              <div key={c.id} className="rounded border bg-white overflow-hidden shadow-sm">
                <div className="aspect-[16/9] bg-gray-100">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">{c.name}</div>
                    <span className={`text-xs px-2 py-1 rounded ${c.launched ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {c.launched ? 'Launched' : 'Hidden'}
                    </span>
                  </div>
                  {!!c.sizes?.length && (
                    <div className="mt-2 text-xs text-gray-600">
                      Sizes: {c.sizes.join(', ')}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Category">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          <Input label="Sizes (CSV)" placeholder="S,M,L,XL" value={(form as any).sizesCsv} onChange={(e) => setForm({ ...form, sizesCsv: e.target.value })} />
          <Input label="Location (optional)" value={(form as any).location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.launched} onChange={(e) => setForm({ ...form, launched: e.target.checked })} />
            <span className="text-sm">Launched (visible in store)</span>
          </label>
          <div className="flex gap-2">
            <Button type="submit">Create</Button>
            <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>Clear</Button>
          </div>
        </form>
      </Modal>

      {/* Edit */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Category">
        {!editing ? null : (
          <div className="space-y-4">
            <Input label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            <Input label="Image URL" value={editForm.image_url} onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })} />
            <Input label="Sizes (CSV)" value={(editForm as any).sizesCsv} onChange={(e) => setEditForm({ ...editForm, sizesCsv: e.target.value })} />
            <Input label="Location (optional)" value={(editForm as any).location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={editForm.launched} onChange={(e) => setEditForm({ ...editForm, launched: e.target.checked })} />
              <span className="text-sm">Launched (visible in store)</span>
            </label>
            <div className="flex gap-2">
              <Button onClick={handleUpdate}>Save</Button>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminCategories;
