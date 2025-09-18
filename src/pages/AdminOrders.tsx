// src/pages/AdminOrders.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { PlusCircle, RefreshCcw, Pencil, Trash2, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { AdminOrdersService } from '../services/firestore';
import { createOrderWithAutoNumber } from '../services/orders';

type OrderItem = {
  name: string;
  qty: number;
  price: number;
};

type Order = {
  id: string;
  userId?: string;
  items?: OrderItem[];
  subtotal?: number;
  total?: number;
  status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'refunded' | 'failed';
  address?: string;
  note?: string;
  createdAt?: any;
  updatedAt?: any;
};

type UIItem = {
  name: string;
  qtyStr: string;   // UI-only
  priceStr: string; // UI-only
};

function toJsDate(v: any): Date | null {
  if (!v) return null;
  if (v?.toDate) return v.toDate();
  if (v instanceof Date) return v;
  return null;
}

const toNum = (v: any, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

/** Normalize “line item” shapes into { name, qty, price } numbers */
function normalizeItems(raw: any): OrderItem[] {
  if (!raw) return [];
  const list: any[] = Array.isArray(raw) ? raw : typeof raw === 'object' ? Object.values(raw) : [];
  const std = list.map((x) => {
    const name =
      x?.name ??
      x?.product_name ??
      x?.title ??
      x?.product?.name ??
      x?.productId ??
      'Item';
    const qty =
      toNum(x?.qty, NaN) ?? NaN;
    const qtyAlt =
      toNum(x?.quantity, NaN) ?? toNum(x?.count, NaN) ?? toNum(x?.qtyStr, NaN);
    const price =
      toNum(x?.price, NaN) ?? NaN;
    const priceAlt =
      toNum(x?.unitPrice, NaN) ?? toNum(x?.amount, NaN) ?? toNum(x?.priceStr, NaN);

    return {
      name: String(name),
      qty: Number.isFinite(qty) ? qty : (Number.isFinite(qtyAlt) ? qtyAlt : 0),
      price: Number.isFinite(price) ? price : (Number.isFinite(priceAlt) ? priceAlt : 0),
    } as OrderItem;
  });
  // Filter out totally empty rows
  return std.filter((it) => it.name || it.qty || it.price);
}

const AdminOrders: React.FC = () => {
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add modal
  const [newUserId, setNewUserId] = useState('');
  const [newTotal, setNewTotal] = useState('');
  const [newStatus, setNewStatus] = useState<Order['status']>('pending');
  const [newPaymentStatus, setNewPaymentStatus] = useState<Order['paymentStatus']>('pending');
  const [newAddress, setNewAddress] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newItems, setNewItems] = useState<UIItem[]>([{ name: '', qtyStr: '1', priceStr: '0' }]);

  // Edit modal
  const [editing, setEditing] = useState<Order | null>(null);
  const [editUserId, setEditUserId] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [editStatus, setEditStatus] = useState<Order['status']>('pending');
  const [editPaymentStatus, setEditPaymentStatus] = useState<Order['paymentStatus']>('pending');
  const [editAddress, setEditAddress] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editItems, setEditItems] = useState<UIItem[]>([]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setFetchErr('');
      const list = await AdminOrdersService.getAll();

      setRows(
        list.map((r: any) => {
          const items = normalizeItems(r.items ?? r.lineItems ?? r.products ?? []);
          return {
            id: r.id,
            userId: r.userId ?? r.uid ?? '',
            customerName: r.customerName ?? r.userName ?? r.name ?? '',
            orderCode: r.orderCode ?? r.code ?? '',
            items,
            subtotal: Number.isFinite(r.subtotal) ? Number(r.subtotal) : items.reduce((s, it) => s + it.qty * it.price, 0),
            total: Number(r.total ?? 0),
            status: r.status ?? 'pending',
            paymentStatus: r.paymentStatus ?? 'pending',
            address: r.address ?? '',
            note: r.note ?? '',
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          } as Order;
        })
      );
    } catch (e: any) {
      console.error('Fetch orders failed:', e);
      setFetchErr(e?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ------------------------------ Add modal ------------------------------ */
  const openAdd = () => {
    setNewUserId('');
    setNewTotal('');
    setNewStatus('pending');
    setNewPaymentStatus('pending');
    setNewAddress('');
    setNewNote('');
    setNewItems([{ name: '', qtyStr: '1', priceStr: '0' }]);
    setAddOpen(true);
  };

  const addNewItemRow = () => setNewItems((prev) => [...prev, { name: '', qtyStr: '1', priceStr: '0' }]);
  const updateNewItem = (i: number, patch: Partial<UIItem>) =>
    setNewItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const removeNewItem = (i: number) => setNewItems((prev) => prev.filter((_, idx) => idx !== i));

  const newSubtotal = useMemo(
    () => newItems.reduce((sum, it) => sum + toNum(it.qtyStr) * toNum(it.priceStr), 0),
    [newItems]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const safeItems: OrderItem[] = newItems
      .map((it) => ({
        name: String(it.name ?? ''),
        qty: Math.max(0, toNum(it.qtyStr)),
        price: Math.max(0, toNum(it.priceStr)),
      }))
      .filter((it) => it.name || it.qty || it.price);

    const totalNum = newTotal.trim() === '' ? newSubtotal : Math.max(0, toNum(newTotal, newSubtotal));

    try {
      setSubmitting(true);
      setAddOpen(false);
      await createOrderWithAutoNumber({
        userId: newUserId || '',
        items: safeItems,
        total: totalNum,
        status: newStatus,
        extra: {
          paymentStatus: newPaymentStatus,
          address: newAddress || null,
          note: newNote || null,
          subtotal: newSubtotal,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
  await fetchOrders();
    } catch (e: any) {
      console.error('Create order failed:', e);
      alert(e?.message || 'Failed to add order.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------ Edit modal ----------------------------- */
  const openEdit = (o: Order) => {
    setEditing(o);
    setEditUserId(o.userId || '');
    setEditTotal(String(o.total ?? ''));
    setEditStatus(o.status ?? 'pending');
    setEditPaymentStatus(o.paymentStatus ?? 'pending');
    setEditAddress(o.address || '');
    setEditNote(o.note || '');
    setEditItems(
      normalizeItems(o.items).map((it) => ({
        name: it.name,
        qtyStr: String(it.qty),
        priceStr: String(it.price),
      }))
    );
    setEditOpen(true);
  };

  const updateEditItem = (i: number, patch: Partial<UIItem>) =>
    setEditItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const removeEditItem = (i: number) => setEditItems((prev) => prev.filter((_, idx) => idx !== i));
  const addEditItemRow = () => setEditItems((prev) => [...prev, { name: '', qtyStr: '1', priceStr: '0' }]);

  const computedSubtotal = useMemo(
    () => editItems.reduce((sum, it) => sum + toNum(it.qtyStr) * toNum(it.priceStr), 0),
    [editItems]
  );

  const handleUpdate = async () => {
    if (!editing) return;

    const safeItems: OrderItem[] = editItems
      .map((it) => ({
        name: String(it.name ?? ''),
        qty: Math.max(0, toNum(it.qtyStr)),
        price: Math.max(0, toNum(it.priceStr)),
      }))
      .filter((it) => it.name || it.qty || it.price);

    const totalNum = editTotal.trim() === '' ? computedSubtotal : Math.max(0, toNum(editTotal, computedSubtotal));

    try {
      setSubmitting(true);
      await AdminOrdersService.update(editing.id, {
        userId: editUserId || null, // kept read-only
        items: safeItems,           // canonical
        subtotal: computedSubtotal,
        total: totalNum,
        status: editStatus,
        paymentStatus: editPaymentStatus,
        address: editAddress || null,
        note: editNote || null,
        updatedAt: new Date(),
      });
      setEditOpen(false);
      setEditing(null);
      await fetchOrders();
    } catch (e: any) {
      console.error('Update order failed:', e);
      alert(e?.message || 'Update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    if (!confirm('Delete this order?')) return;
    try {
      await AdminOrdersService.delete(editing.id);
      setEditOpen(false);
      setEditing(null);
      await fetchOrders();
    } catch (e: any) {
      console.error('Delete order failed:', e);
      alert(e?.message || 'Delete failed.');
    }
  };

  /* -------------------------------- UI -------------------------------- */
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const ad = toJsDate(a.createdAt)?.getTime() ?? 0;
        const bd = toJsDate(b.createdAt)?.getTime() ?? 0;
        return bd - ad;
      }),
    [rows]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchOrders}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={openAdd}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Order
          </Button>
        </div>
      </div>

      {fetchErr && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {fetchErr}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4 overflow-x-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />
            Loading…
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-sm text-gray-500 p-4">No orders yet.</div>
        ) : (
          <table className="min-w-[900px] text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Order #</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Items</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Payment</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-mono">{o.orderCode || `${o.id.slice(0,8)}…`}</td>
                  <td className="py-2 pr-4">{(o as any).customerName || '—'}</td>
                  <td className="py-2 pr-4">{normalizeItems(o.items).length} item(s)</td>
                  <td className="py-2 pr-4">₹{Number(o.total ?? 0).toFixed(2)}</td>
                  <td className="py-2 pr-4">
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">{o.status}</span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">{o.paymentStatus}</span>
                  </td>
                  <td className="py-2 pr-4">{toJsDate(o.createdAt)?.toLocaleDateString() || '—'}</td>
                  <td className="py-2 pr-4">
                    <Button size="sm" variant="outline" onClick={() => openEdit(o)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Order Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Order">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="User ID" value={newUserId} onChange={(e) => setNewUserId(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as Order['status'])}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="processing">processing</option>
                <option value="shipped">shipped</option>
                <option value="delivered">delivered</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
              <select
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value as Order['paymentStatus'])}
                className="block w/full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="refunded">refunded</option>
                <option value="failed">failed</option>
              </select>
            </div>
          </div>

          <Input label="Address" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
          <Input label="Note" value={newNote} onChange={(e) => setNewNote(e.target.value)} />

          {/* Items grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Items</label>
              <div className="text-xs text-gray-600">
                Subtotal: <span className="font-semibold">₹{newSubtotal.toFixed(2)}</span>
              </div>
            </div>

            {newItems.length === 0 ? (
              <div className="text-xs text-gray-500 mb-3">No items. Add one below.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {newItems.map((it, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="Product Name"
                        value={it.name}
                        onChange={(e) => updateNewItem(idx, { name: e.target.value })}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                        <input
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min={0}
                          value={it.qtyStr}
                          onChange={(e) => updateNewItem(idx, { qtyStr: e.target.value })}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                        <input
                          inputMode="decimal"
                          value={it.priceStr}
                          onChange={(e) => updateNewItem(idx, { priceStr: e.target.value })}
                          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        Line Total: ₹{(toNum(it.qtyStr) * toNum(it.priceStr)).toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewItem(idx)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100"
                        title="Remove item"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3">
              <Button type="button" variant="outline" onClick={addNewItemRow}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>

          <Input
            label="Total (₹)"
            value={newTotal}
            onChange={(e) => setNewTotal(e.target.value)}
            placeholder={`Leave blank to use subtotal ₹${newSubtotal.toFixed(2)}`}
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={submitting}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create
            </Button>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Order Modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        title="Edit Order"
      >
        {!editing ? null : (
          <div className="space-y-4">
            {/* Read-only IDs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                <input
                  value={editing.id}
                  disabled
                  className="block w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  value={editUserId}
                  disabled
                  onChange={(e) => setEditUserId(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Order['status'])}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="pending">pending</option>
                  <option value="paid">paid</option>
                  <option value="processing">processing</option>
                  <option value="shipped">shipped</option>
                  <option value="delivered">delivered</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
                <select
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value as Order['paymentStatus'])}
                  className="block w/full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="pending">pending</option>
                  <option value="paid">paid</option>
                  <option value="refunded">refunded</option>
                  <option value="failed">failed</option>
                </select>
              </div>
            </div>

            <Input label="Address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            <Input label="Note" value={editNote} onChange={(e) => setEditNote(e.target.value)} />

            {/* Items grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Items</label>
                <div className="text-xs text-gray-600">
                  Subtotal: <span className="font-semibold">₹{computedSubtotal.toFixed(2)}</span>
                </div>
              </div>

              {editItems.length === 0 ? (
                <div className="text-xs text-gray-500 mb-3">No items. Add one below.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {editItems.map((it, idx) => (
                    <div key={idx} className="rounded-lg border border-gray-200 p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                          label="Product Name"
                          value={it.name}
                          onChange={(e) => updateEditItem(idx, { name: e.target.value })}
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                          <input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min={0}
                            value={it.qtyStr}
                            onChange={(e) => updateEditItem(idx, { qtyStr: e.target.value })}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                          <input
                            inputMode="decimal"
                            value={it.priceStr}
                            onChange={(e) => updateEditItem(idx, { priceStr: e.target.value })}
                            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs text-gray-600">
                          Line Total: ₹{(toNum(it.qtyStr) * toNum(it.priceStr)).toFixed(2)}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEditItem(idx)}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100"
                          title="Remove item"
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3">
                <Button type="button" variant="outline" onClick={addEditItemRow}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            <Input
              label="Total (₹)"
              value={editTotal}
              onChange={(e) => setEditTotal(e.target.value)}
              placeholder={`Leave blank to use subtotal ₹${computedSubtotal.toFixed(2)}`}
            />

            <div className="flex gap-3 pt-2">
              <Button onClick={handleUpdate} loading={submitting}>Save Changes</Button>
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

export default AdminOrders;
