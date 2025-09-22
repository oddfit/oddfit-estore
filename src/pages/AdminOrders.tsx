// src/pages/AdminOrders.tsx
import React, { useEffect, useState } from 'react';
import { RefreshCcw, Save } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { AdminOrdersService, ordersService } from '../services/firestore';
import { toJsDate } from '../hooks/useCategories';

type Row = {
  id: string;
  orderCode?: string | null;
  userId?: string;
  total: number;
  status: string;
  orderDate?: Date;
  createdAt?: Date;
  trackingNumber?: string;
  trackingUrl?: string;
};

const STATUS = ['pending','confirmed','processing','shipped','delivered','cancelled'] as const;

const AdminOrders: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const raw = await AdminOrdersService.getAll();
      const list: Row[] = raw.map((o: any) => ({
        id: o.id,
        orderCode: o.orderCode || o.orderNumber || null,
        userId: o.userId || '',
        total: Number(o.total || 0),
        status: String(o.status || 'pending'),
        orderDate: toJsDate(o.orderDate) || undefined,
        createdAt: toJsDate(o.createdAt) || undefined,
        trackingNumber: o.trackingNumber || '',
        trackingUrl: o.trackingUrl || '',
      }));
      // newest first by createdAt
      list.sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
      setRows(list);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (r: Row) => {
    setLoading(true);
    setErr('');
    try {
      // If moving into "shipped", stamp shippedAt (client-side)
      const patch: any = {
        status: r.status,
        trackingNumber: r.trackingNumber || '',
        trackingUrl: r.trackingUrl || '',
      };
      if (r.status === 'shipped') patch.shippedAt = new Date();

      await ordersService.update(r.id, patch);
      await load();
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Save failed.');
    } finally {
      setLoading(false);
    }
  };

  const editLocal = (id: string, patch: Partial<Row>) => {
    setRows(prev => prev.map(x => x.id === id ? { ...x, ...patch } : x));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Button variant="outline" onClick={load}><RefreshCcw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>

      {err && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{err}</div>}
      {loading && <div className="mb-4 text-sm text-gray-600">Working…</div>}

      {rows.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-gray-600">No orders.</div>
      ) : (
        <div className="space-y-4">
          {rows.map(r => (
            <div key={r.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <div className="font-semibold text-gray-900">
                    Order #{String(r.orderCode || r.id.slice(-8))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Placed {r.orderDate ? r.orderDate.toLocaleString() : '—'} • User {r.userId || '—'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">₹{r.total.toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <label className="text-xs font-medium text-gray-700">
                  Status
                  <select
                    className="mt-1 block w-full rounded border px-2 py-2"
                    value={r.status}
                    onChange={e => editLocal(r.id, { status: e.target.value })}
                  >
                    {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>

                <Input
                  label="Tracking #"
                  value={r.trackingNumber || ''}
                  onChange={(e) => editLocal(r.id, { trackingNumber: e.target.value })}
                  placeholder="e.g. AWB / consignment no."
                />

                <Input
                  label="Tracking URL"
                  value={r.trackingUrl || ''}
                  onChange={(e) => editLocal(r.id, { trackingUrl: e.target.value })}
                  placeholder="https://courier.example.com/track/ABC123"
                />

                <div className="flex items-end">
                  <Button onClick={() => save(r)}>
                    <Save className="h-4 w-4 mr-2" /> Save
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
