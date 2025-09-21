// src/pages/AdminBanners.tsx
import React, { useEffect, useState } from 'react';
import { Upload, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
  listAllBanners,
  createBanner,
  updateBanner,
  uploadBannerImage,
  removeBanner, // ✅ add delete
} from '../services/banners';

type Banner = {
  id?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  title?: string;
  subtitle?: string;
  order: number;
  active: boolean;
};

const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>('');

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

  const onUploadMobile = async (b: Banner, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setErr('');
    try {
      const url = await uploadBannerImage(files[0]);
      await updateBanner(b.id!, { mobileImageUrl: url });
      await load();
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Mobile upload failed.');
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

  const saveLocal = (id: string | undefined, patch: Partial<Banner>) => {
    setBanners((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const persist = async (b: Banner) => {
    if (!b.id) return;
    setBusy(true);
    setErr('');
    try {
      await updateBanner(b.id, {
        title: b.title || '',
        subtitle: b.subtitle || '',
        linkUrl: b.linkUrl || '',
        active: !!b.active,
        order: Number(b.order || 0),
        // image fields are optional in the patch; we only send if user changed them
        ...(b.imageUrl ? { imageUrl: b.imageUrl } : {}),
        ...(b.mobileImageUrl ? { mobileImageUrl: b.mobileImageUrl } : {}),
      });
      await load();
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Save failed.');
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

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Banners</h1>

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
              className="rounded-lg border bg-white p-3 flex gap-4 items-center"
            >
              <img
                src={b.imageUrl}
                alt={b.title || 'Banner'}
                className="w-40 h-20 object-cover rounded"
              />

              {/* Mobile thumb + upload */}
              <div className="flex flex-col items-center gap-1">
                <img
                  src={b.mobileImageUrl || b.imageUrl}
                  alt="Mobile"
                  className="w-24 h-16 object-cover rounded border"
                  title="Mobile preview"
                />
                <label className="text-xs text-purple-700 cursor-pointer">
                  Set mobile…
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onUploadMobile(b, e.target.files)}
                  />
                </label>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Title"
                  value={b.title || ''}
                  onChange={(e) => saveLocal(b.id, { title: e.target.value })}
                />
                <Input
                  label="Subtitle"
                  value={b.subtitle || ''}
                  onChange={(e) => saveLocal(b.id, { subtitle: e.target.value })}
                />
                <Input
                  label="Link URL (optional)"
                  value={b.linkUrl || ''}
                  onChange={(e) => saveLocal(b.id, { linkUrl: e.target.value })}
                />

                <Input
                  label="Mobile Image URL (optional)"
                  value={b.mobileImageUrl || ''}
                  onChange={(e) =>
                    saveLocal(b.id, { mobileImageUrl: e.target.value })
                  }
                />

                <Input
                  label="Order"
                  type="number"
                  value={String(b.order ?? 0)}
                  onChange={(e) =>
                    saveLocal(b.id, { order: Number(e.target.value || 0) })
                  }
                />

                <label className="text-xs font-medium text-gray-600 mt-6 sm:mt-0">
                  Active
                  <input
                    type="checkbox"
                    className="ml-2 align-middle"
                    checked={!!b.active}
                    onChange={(e) => saveLocal(b.id, { active: e.target.checked })}
                  />
                </label>
              </div>

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
                <button
                  className="p-2 rounded border hover:bg-gray-50"
                  onClick={() => persist(b)}
                  title="Save"
                >
                  <Save className="h-4 w-4" />
                </button>
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
    </div>
  );
};

export default AdminBanners;
