import React, { useEffect, useMemo, useState } from 'react';
import { PlusCircle, RefreshCcw, Pencil, Trash2, Save, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import {
  AdminReturnsService,
  returnsService,
  ordersService,
  getNextSequence,
  formatSequence,
} from '../services/firestore';

type ReturnReq = {
  id?: string;
  raCode?: string;
  orderId: string;          // Firestore order doc id (normalized)
  productId?: string;
  reason?: string;
  status?: 'requested' | 'approved' | 'rejected' | 'received' | 'refunded';
  createdAt?: any;
  updatedAt?: any;
};

type DeliveredOrder = {
  id: string;               // order doc id
  orderCode?: string;       // e.g., OD2025100001
  orderNumber?: number;     // legacy
  createdAt?: any;
  total?: number;
};

const STATUS: Required<ReturnReq>['status'][] = [
  'requested', 'approved', 'rejected', 'received', 'refunded'
];

const emptyForm: ReturnReq = {
  orderId: '',
  productId: '',
  reason: '',
  status: 'requested',
};

function orderLabel(o: DeliveredOrder) {
  const code =
    (o.orderCode as string) ??
    (typeof o.orderNumber === 'number' ? `#${o.orderNumber}` : `#${o.id.slice(-6)}`);
  const when = o.createdAt?.toDate?.()?.toLocaleDateString?.() ?? '';
  const total = typeof o.total === 'number' ? `₹${o.total.toFixed(2)}` : '';
  return `${code}${when ? ` — ${when}` : ''}${total ? ` — ${total}` : ''}`;
}

const AdminReturns: React.FC = () => {
  // data
  const [rows, setRows] = useState<ReturnReq[]>([]);
  const [delivered, setDelivered] = useState<DeliveredOrder[]>([]);
  const deliveredMap = useMemo(
    () => Object.fromEntries(delivered.map(o => [o.id, orderLabel(o)])),
    [delivered]
  );

  // ui
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // create/edit
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<ReturnReq>(emptyForm);
  const [editing, setEditing] = useState<ReturnReq | null>(null);
  const [editForm, setEditForm] = useState<ReturnReq>(emptyForm);

  // Load returns
  const fetchReturns = async () => {
    try {
      setLoading(true);
      setErr('');
      const data = await AdminReturnsService.getAll();
      setRows(
        data.map((r: any) => ({
          id: r.id,
          raCode: r.raCode || '',
          orderId: r.orderId || '',
          productId: r.productId || '',
          reason: r.reason || '',
          status: (r.status as ReturnReq['status']) || 'requested',
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }))
      );
    } catch (e: any) {
      setErr(e?.message || 'Failed to load returns.');
    } finally {
      setLoading(false);
    }
  };

  // Load delivered orders (no orderBy to avoid composite index requirement)
  const fetchDeliveredOrders = async () => {
    try {
      const list = await ordersService.query([
        { field: 'status', operator: '==', value: 'delivered' }
      ]);

      const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
      const toMs = (v: any): number =>
        v?.toDate?.()?.getTime?.() ??
        (v instanceof Date ? v.getTime() : 0);

      const filtered = list
        .map((o: any) => ({
          id: o.id,
          orderCode: o.orderCode,
          orderNumber: o.orderNumber,
          createdAt: o.createdAt,
          total: o.total,
        }))
        .filter(o => toMs(o.createdAt) >= cutoffMs)        // keep only last 30 days
        .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt)); // newest first

      setDelivered(filtered);
    } catch (e) {
      console.error('Failed to load delivered orders:', e);
    }
  };


  const reloadAll = async () => {
    await Promise.all([fetchReturns(), fetchDeliveredOrders()]);
  };

  useEffect(() => {
    reloadAll();
  }, []);

  // CRUD helpers
  const openCreate = () => {
    setForm(emptyForm);
    setAddOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderId) {
      alert('Select a delivered order.');
      return;
    }
    // safety: ensure selected is still a delivered order
    if (!delivered.find(d => d.id === form.orderId)) {
      alert('Only delivered orders can have returns.');
      return;
    }

    try {
      setLoading(true);
      setErr('');
      // RET auto-number
      const seq = await getNextSequence('returns', 100001);
      const raCode = formatSequence(seq, 'RET', 6);

      await returnsService.create({
        raCode,
        orderId: form.orderId,       // normalized doc id
        productId: (form.productId || '').trim(),
        reason: (form.reason || '').trim(),
        status: form.status || 'requested',
        createdAt: new Date(),
      });

      setAddOpen(false);
      setForm(emptyForm);
      await fetchReturns();
    } catch (e: any) {
      setErr(e?.message || 'Create failed.');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (r: ReturnReq) => {
    setEditing(r);
    setEditForm({
      orderId: r.orderId || '',
      productId: r.productId || '',
      reason: r.reason || '',
      status: r.status || 'requested',
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editing?.id) return;
    if (!editForm.orderId) {
      alert('Select a delivered order.');
      return;
    }
    if (!delivered.find(d => d.id === editForm.orderId)) {
      alert('Only delivered orders can have returns.');
      return;
    }

    try {
      setLoading(true);
      setErr('');
      await returnsService.update(editing.id, {
        orderId: editForm.orderId,
        productId: (editForm.productId || '').trim(),
        reason: (editForm.reason || '').trim(),
        status: editForm.status || 'requested',
      });
      setEditOpen(false);
      setEditing(null);
      await fetchReturns();
    } catch (e: any) {
      setErr(e?.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this return?')) return;
    try {
      setLoading(true);
      setErr('');
      await returnsService.delete(id);
      await fetchReturns();
    } catch (e: any) {
      setErr(e?.message || 'Delete failed.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatusInline = async (id: string, status: ReturnReq['status']) => {
    try {
      await returnsService.update(id, { status });
      setRows(r => r.map(x => (x.id === id ? { ...x, status } : x)));
    } catch (e: any) {
      alert(e?.message || 'Failed to update status.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Returns</h1>
        <div className="mt-1 text-xs text-gray-500">
          Only delivered orders from the last 30 days can be returned.
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={reloadAll}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Return
          </Button>
        </div>
      </div>

      {err && (
        <div className="mb-4 border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4 overflow-x-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-600">No return requests.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">RA Code</th>
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 pr-4">Reason</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{r.raCode || '—'}</td>
                  <td className="py-2 pr-4">
                    {/* Show human-friendly order label from delivered list (fallback to id) */}
                    {deliveredMap[r.orderId] || `#${r.orderId?.slice?.(-6) || r.orderId || '—'}`}
                  </td>
                  <td className="py-2 pr-4">{r.productId || '—'}</td>
                  <td className="py-2 pr-4 max-w-xs truncate" title={r.reason}>
                    {r.reason || '—'}
                  </td>
                  <td className="py-2 pr-4">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatusInline(r.id!, e.target.value as ReturnReq['status'])}
                      className="border rounded px-2 py-1"
                    >
                      {STATUS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(r.id!)}>
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

      {/* Create modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Create Return">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Delivered Order</label>
            <select
              value={form.orderId}
              onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              required
            >
              <option value="">— Select delivered order —</option>
              {delivered.map((o) => (
                <option key={o.id} value={o.id}>
                  {orderLabel(o)}
                </option>
              ))}
            </select>
            <div className="mt-1 text-xs text-gray-500">
              Only delivered orders can be returned.
            </div>
          </div>

          <Input
            label="Product ID (optional)"
            value={form.productId || ''}
            onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
          />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
            <textarea
              value={form.reason || ''}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              rows={3}
              placeholder="Why is this being returned?"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-600">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ReturnReq['status'] }))}
              className="rounded border px-2 py-1 text-sm"
            >
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Create
            </Button>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Return">
        {!editing ? null : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Delivered Order</label>
              <select
                value={editForm.orderId}
                onChange={(e) => setEditForm((f) => ({ ...f, orderId: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                required
              >
                <option value="">— Select delivered order —</option>
                {delivered.map((o) => (
                  <option key={o.id} value={o.id}>
                    {orderLabel(o)}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Product ID (optional)"
              value={editForm.productId || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, productId: e.target.value }))}
            />

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
              <textarea
                value={editForm.reason || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, reason: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                rows={3}
                placeholder="Why is this being returned?"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-600">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as ReturnReq['status'] }))}
                className="rounded border px-2 py-1 text-sm"
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUpdate}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminReturns;
