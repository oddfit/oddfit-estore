// src/pages/AdminBanners.tsx
import React, { useEffect, useState } from 'react';
import { Upload, Trash2, ArrowUp, ArrowDown, RefreshCcw, Pencil, Save } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import {
  listAllBanners,
  createBanner,
  updateBanner,
  uploadBannerImage,
  removeBanner,
} from '../services/banners';

type Banner = {
  id?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  title?: string;
  subtitle?: string;
  mobileTitle?: string;
  mobileSubtitle?: string;
  buttonText?: string;
  desktopTextAlign?: 'left' | 'center' | 'right';
  order: number;
  active: boolean;
};

const emptyBanner: Banner = {
  imageUrl: '',
  mobileImageUrl: '',
  linkUrl: '',
  title: '',
  subtitle: '',
  mobileTitle: '',
  mobileSubtitle: '',
  buttonText: '',
  desktopTextAlign: 'left',
  order: 0,
  active: true,
};

const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>('');

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [editForm, setEditForm] = useState<Banner>(emptyBanner);

  const load = async () => {
    setBusy(true);
    setErr('');
    try {
      const list = (await listAllBanners()) as any[];
      setBanners(
        list.map((b) => ({
          id: b.id,
          imageUrl: b.imageUrl || '',
          mobileImageUrl: b.mobileImageUrl || '',
          linkUrl: b.linkUrl || '',
          title: b.title || '',
          subtitle: b.subtitle || '',
          mobileTitle: b.mobileTitle || '',
          mobileSubtitle: b.mobileSubtitle || '',
          buttonText: b.buttonText || '',
          desktopTextAlign: (b.desktopTextAlign as any) || 'left',
          order: Number(b.order ?? 0),
          active: !!b.active,
        }))
      );
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Failed to load banners.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setErr('');
    try {
      const startOrder = banners.length
        ? Math.max(...banners.map((b) => Number(b.order || 0))) + 1
        : 1;
      let order = startOrder;

      for (const file of Array.from(files)) {
        const url = await uploadBannerImage(file);
        await createBanner({
          imageUrl: url,
          title: '',
          subtitle: '',
          linkUrl: '',
          active: true,
          order,
        });
        order += 1;
      }
      await load();
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= banners.length) return;
    const a = banners[index];
    const b = banners[next];

    setBusy(true);
    setErr('');
    try {
      await updateBanner(a.id!, { order: b.order });
      await updateBanner(b.id!, { order: a.order });
      await load();
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Reorder failed.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (b: Banner) => {
    if (!b.id) return;
    if (!confirm('Delete this banner?')) return;
    setBusy(true);
    setErr('');
    try {
      await removeBanner(b.id);
      await load();
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Delete failed.');
    } finally {
      setBusy(false);
    }
  };

  // ---- Edit modal helpers
  const openEdit = (b: Banner) => {
    setEditing(b);
    setEditForm({
      id: b.id,
      imageUrl: b.imageUrl || '',
      mobileImageUrl: b.mobileImageUrl || '',
      linkUrl: b.linkUrl || '',
      title: b.title || '',
      subtitle: b.subtitle || '',
      mobileTitle: b.mobileTitle || '',
      mobileSubtitle: b.mobileSubtitle || '',
      buttonText: b.buttonText || '',
      desktopTextAlign: b.desktopTextAlign || 'left',
      order: Number(b.order || 0),
      active: !!b.active,
    });
    setEditOpen(true);
  };

  const handleTextField =
    (field: keyof Banner) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setEditForm((prev) => ({ ...prev, [field]: e.target.value } as Banner));
    };

  const replaceDesktopImage = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      setBusy(true);
      const url = await uploadBannerImage(files[0]);
      setEditForm((p) => ({ ...p, imageUrl: url }));
    } catch (e: any) {
      alert(e?.message || 'Failed to upload image.');
    } finally {
      setBusy(false);
    }
  };

  const replaceMobileImage = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      setBusy(true);
      const url = await uploadBannerImage(files[0]);
      setEditForm((p) => ({ ...p, mobileImageUrl: url }));
    } catch (e: any) {
      alert(e?.message || 'Failed to upload image.');
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!editing?.id) return;
    try {
      setBusy(true);
      setErr('');
      await updateBanner(editing.id, {
        title: editForm.title || '',
        subtitle: editForm.subtitle || '',
        mobileTitle: editForm.mobileTitle || '',
        mobileSubtitle: editForm.mobileSubtitle || '',
        buttonText: editForm.buttonText || '',
        desktopTextAlign: editForm.desktopTextAlign || 'left',
        linkUrl: editForm.linkUrl || '',
        active: !!editForm.active,
        order: Number(editForm.order || 0),
        ...(editForm.imageUrl ? { imageUrl: editForm.imageUrl } : {}),
        ...(editForm.mobileImageUrl ? { mobileImageUrl: editForm.mobileImageUrl } : {}),
      });
      setEditOpen(false);
      setEditing(null);
      await load();
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Banners</h1>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={load}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onUpload(e.target.files)}
              className="hidden"
            />
            <span className="rounded-lg border px-3 py-2 text-sm bg-white hover:bg-gray-50 flex items-center gap-2">
              <Upload className="h-4 w-4" /> Upload images
            </span>
          </label>
        </div>
      </div>

      {err && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {busy && <div className="mb-4 text-sm text-gray-600">Working…</div>}

      {banners.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-gray-600">
          No banners yet. Use “Upload images” to add.
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((b, i) => (
            <div
              key={b.id}
              className="rounded-lg border bg-white p-3 flex items-center gap-4"
            >
              {/* Desktop thumb */}
              <img
                src={b.imageUrl}
                alt={b.title || 'Banner'}
                className="w-40 h-20 object-cover rounded"
              />

              {/* Brief meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-gray-900 truncate">
                    {b.title || '(Untitled)'}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {b.active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                {b.subtitle ? (
                  <div className="text-xs text-gray-600 truncate">{b.subtitle}</div>
                ) : null}
                <div className="text-xs text-gray-500 mt-1">
                  Order: <span className="font-medium">{b.order}</span> • Text:{' '}
                  {b.desktopTextAlign || 'left'}
                </div>
              </div>

              {/* Row actions */}
              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded border hover:bg-gray-50"
                  onClick={() => move(i, -1)}
                  title="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  className="p-2 rounded border hover:bg-gray-50"
                  onClick={() => move(i, +1)}
                  title="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <button
                  className="p-2 rounded border hover:bg-red-50"
                  onClick={() => remove(b)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Banner Modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        title="Edit Banner"
      >
        {!editing ? null : (
          <div className="space-y-4">
            {/* Image previews + replace */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Desktop Image</div>
                <img
                  src={editForm.imageUrl}
                  alt="Desktop"
                  className="w-full max-w-sm h-32 object-cover rounded border"
                />
                <label className="mt-2 inline-flex items-center gap-2 cursor-pointer text-sm text-purple-700">
                  Replace…
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => replaceDesktopImage(e.target.files)}
                  />
                </label>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Mobile Image</div>
                <img
                  src={editForm.mobileImageUrl || editForm.imageUrl}
                  alt="Mobile"
                  className="w-full max-w-xs h-28 object-cover rounded border"
                />
                <label className="mt-2 inline-flex items-center gap-2 cursor-pointer text-sm text-purple-700">
                  Replace…
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => replaceMobileImage(e.target.files)}
                  />
                </label>
              </div>
            </div>

            {/* Fields */}
            <Input
              label="Title"
              value={editForm.title || ''}
              onChange={handleTextField('title')}
            />
            <Input
              label="Subtitle"
              value={editForm.subtitle || ''}
              onChange={handleTextField('subtitle')}
            />
            <Input
              label="Mobile Title (optional)"
              value={editForm.mobileTitle || ''}
              onChange={handleTextField('mobileTitle')}
            />
            <Input
              label="Mobile Subtitle (optional)"
              value={editForm.mobileSubtitle || ''}
              onChange={handleTextField('mobileSubtitle')}
            />
            <Input
              label="Button Text"
              value={editForm.buttonText || ''}
              onChange={handleTextField('buttonText')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Link URL (optional)"
                value={editForm.linkUrl || ''}
                onChange={handleTextField('linkUrl')}
              />
              <Input
                label="Mobile Image URL (optional)"
                value={editForm.mobileImageUrl || ''}
                onChange={handleTextField('mobileImageUrl')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Desktop Text Position
                </label>
                <select
                  value={editForm.desktopTextAlign || 'left'}
                  onChange={handleTextField('desktopTextAlign')}
                  className="block w-full rounded border px-2 py-2 text-sm"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <Input
                label="Order"
                type="number"
                value={String(editForm.order ?? 0)}
                onChange={(e: any) =>
                  setEditForm((p) => ({ ...p, order: Number(e.target.value || 0) }))
                }
              />
              <label className="text-xs font-medium text-gray-600 mt-6 inline-flex items-center">
                <input
                  type="checkbox"
                  className="mr-2 align-middle"
                  checked={!!editForm.active}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, active: (e.target as HTMLInputElement).checked }))
                  }
                />
                Active (visible)
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={saveEdit}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  setEditing(null);
                }}
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

export default AdminBanners;
