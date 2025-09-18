import React, { useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import Button from '../components/ui/Button';
import { AdminReturnsService } from '../services/firestore';

type ReturnReq = {
  id: string;
  orderId?: string;
  productId?: string;
  reason?: string;
  status?: 'requested' | 'approved' | 'rejected' | 'received' | 'refunded';
  createdAt?: any;
};

const STATUS: ReturnReq['status'][] = ['requested', 'approved', 'rejected', 'received', 'refunded'];

const AdminReturns: React.FC = () => {
  const [rows, setRows] = useState<ReturnReq[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const fetchAll = async () => {
    try {
      setLoading(true);
      setErr('');
      const data = await AdminReturnsService.getAll();
      setRows(
        data.map((r: any) => ({
          id: r.id,
          orderId: r.orderId ?? '',
          productId: r.productId ?? '',
          reason: r.reason ?? '',
          status: (r.status as ReturnReq['status']) ?? 'requested',
          createdAt: r.createdAt,
        }))
      );
    } catch (e: any) {
      setErr(e?.message || 'Failed to load returns.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: ReturnReq['status']) => {
    try {
      await returnsService.update(id, { status });
      setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch (e: any) {
      alert(e?.message || 'Failed to update status.');
    }
  };

  useEffect(() => { fetchAll(); }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Returns</h1>
        <Button variant="outline" onClick={fetchAll}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {err && <div className="mb-4 border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{err}</div>}

      <div className="bg-white rounded-lg shadow-sm p-4 overflow-x-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-500">No return requests.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Return ID</th>
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 pr-4">Reason</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{r.id}</td>
                  <td className="py-2 pr-4">{r.orderId || '—'}</td>
                  <td className="py-2 pr-4">{r.productId || '—'}</td>
                  <td className="py-2 pr-4 max-w-xs truncate" title={r.reason}>{r.reason || '—'}</td>
                  <td className="py-2 pr-4">
                    <select
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.target.value as ReturnReq['status'])}
                      className="border rounded px-2 py-1"
                    >
                      {STATUS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-4">{r.createdAt?.toDate?.().toLocaleString?.() || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminReturns;
