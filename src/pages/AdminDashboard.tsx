// src/pages/AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  RefreshCcw,
  Package,
  IndianRupee,
  BarChart3,
  Clock,
  Boxes,
  AlertTriangle
} from 'lucide-react';
import Button from '../components/ui/Button';
import {
  ordersService,
  productsService,
  usersService,
  returnsService,
} from '../services/firestore';
import { getAll as getAllInventory } from '../services/inventory';
import { toJsDate } from '../hooks/useCategories';

type AnyOrder = {
  id: string;
  total?: number;
  status?: string;
  paymentStatus?: string;
  userId?: string;
  customerName?: string;
  orderNumber?: number;
  orderCode?: string;
  createdAt?: any;
  orderDate?: any;
  items?: any[];
};

type AnyUser = {
  id: string;
  name?: string;
  phone?: string;
  createdAt?: any;
};

type AnyProduct = {
  id: string;
  product_name?: string;
  name?: string;
  price?: number;
};

type AnyReturn = {
  id: string;
  status?: string;
  createdAt?: any;
};

type InvRow = {
  id: string;
  productId: string;
  size: string;
  stock: number;
  updatedAt?: any;
};

function currency(n: number) {
  return `₹${n.toFixed(2)}`;
}
function isRevenueOrder(o: AnyOrder) {
  const status = (o.status || 'pending').toLowerCase();
  const pay = (o.paymentStatus || 'pending').toLowerCase();
  if (status === 'cancelled' || pay === 'failed' || pay === 'refunded') return false;
  return true;
}
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function sameDay(a: Date, b: Date) { return startOfDay(a).getTime() === startOfDay(b).getTime(); }
function dateInRange(d: Date, from: Date, to: Date) { const t = d.getTime(); return t >= from.getTime() && t <= to.getTime(); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d; }

const Sparkline: React.FC<{ values: number[] }> = ({ values }) => {
  if (!values.length) return null;
  const w = 160, h = 40;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / span) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={pts} className="text-purple-600" />
    </svg>
  );
};

const LOW_STOCK_THRESHOLD = 5;

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [orders, setOrders] = useState<AnyOrder[]>([]);
  const [products, setProducts] = useState<AnyProduct[]>([]);
  const [users, setUsers] = useState<AnyUser[]>([]);
  const [returns, setReturns] = useState<AnyReturn[]>([]);
  const [inventory, setInventory] = useState<InvRow[]>([]);
  const [range, setRange] = useState<'7d' | '30d'>('7d');

  const refresh = async () => {
    try {
      setLoading(true);
      setErr('');
      console.debug('[dashboard] refresh start');
      const [o, p, u, r, inv] = await Promise.all([
        ordersService.getAll(),
        productsService.getAll(),
        usersService.getAll(),
        returnsService.getAll(),
        getAllInventory(),
      ]);

      setOrders((o as any[]).map((x) => ({
        ...x,
        createdAt: toJsDate(x.createdAt) || null,
        orderDate: toJsDate(x.orderDate) || null,
      })));
      setProducts(p as any[]);
      setUsers((u as any[]).map((x) => ({ ...x, createdAt: toJsDate(x.createdAt) || null })));
      setReturns((r as any[]).map((x) => ({ ...x, createdAt: toJsDate(x.createdAt) || null })));

      setInventory((inv as any[]).map((row) => ({
        id: row.id,
        productId: row.productId,
        size: row.size,
        stock: Number(row.stock ?? 0), // NOTE: stock (not qty)
        updatedAt: toJsDate(row.updatedAt) || null,
      })));
      console.debug('[dashboard] refresh OK', {
        orders: (o as any[]).length,
        products: (p as any[]).length,
        users: (u as any[]).length,
        returns: (r as any[]).length,
        inventory: (inv as any[]).length,
      });
    } catch (e: any) {
      console.error('[dashboard] refresh error', e);
      setErr(
        e?.code === 'permission-denied'
          ? 'Permission denied. Ensure your user has role="admin".'
          : e?.message || 'Failed to load dashboard data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const { from, to } = useMemo(() => {
    const to = new Date();
    const from = new Date(range === '7d' ? daysAgo(6) : daysAgo(29));
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }, [range]);

  const orderDateOf = (o: AnyOrder) =>
    (o.createdAt as Date | null) ?? (o.orderDate as Date | null) ?? null;

  const ordersInRange = useMemo(
    () => orders.filter((o) => {
      const d = orderDateOf(o);
      return d ? dateInRange(d, from, to) : false;
    }),
    [orders, from, to]
  );

  const grossSalesTotal = ordersInRange
    .filter(o => (o.status || '').toLowerCase() !== 'cancelled')
    .reduce((s, o) => s + (Number(o.total) || 0), 0);

  const revenueOrders = useMemo(
    () => ordersInRange.filter(isRevenueOrder),
    [ordersInRange]
  );

  const revenueReceivedTotal = ordersInRange
    .filter(o => (o.paymentStatus || '').toLowerCase() === 'paid')
    .reduce((s, o) => s + (Number(o.total) || 0) - (Number((o as any).refundAmount) || 0), 0);

  const revenueTotal = revenueOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);

  const revenueToday = useMemo(() => {
    const today = startOfDay(new Date());
    return revenueOrders
      .filter((o) => {
        const d = orderDateOf(o);
        return d ? sameDay(d, today) : false;
      })
      .reduce((s, o) => s + (Number(o.total) || 0), 0);
  }, [revenueOrders]);

  const orderCount = ordersInRange.length;

  const customerCount = useMemo(
    () => users.filter((u) => {
      const d = u.createdAt as Date | null;
      return d ? dateInRange(d, from, to) : false;
    }).length,
    [users, from, to]
  );

  const returnsCount = useMemo(
    () => returns.filter((r) => {
      const d = r.createdAt as Date | null;
      return d ? dateInRange(d, from, to) : false;
    }).length,
    [returns, from, to]
  );

  const aov = orderCount ? revenueTotal / Math.max(revenueOrders.length, 1) : 0;

  const statusCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of ordersInRange) {
      const s = (o.status || 'pending').toLowerCase();
      map.set(s, (map.get(s) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [ordersInRange]);

  const days = range === '7d' ? 7 : 30;
  const timeline = useMemo(() => {
    const buckets: { label: string; date: Date; total: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = startOfDay(daysAgo(i));
      buckets.push({ label: d.toLocaleDateString(), date: d, total: 0 });
    }
    for (const o of revenueOrders) {
      const d0 = orderDateOf(o);
      if (!d0) continue;
      const d = startOfDay(d0);
      const b = buckets.find((x) => x.date.getTime() === d.getTime());
      if (b) b.total += Number(o.total) || 0;
    }
    return buckets;
  }, [revenueOrders, range]);

  const timelineMax = useMemo(() => Math.max(...timeline.map((t) => t.total), 1), [timeline]);

  // Inventory KPIs
  const totalVariants = inventory.length;
  const totalUnits = inventory.reduce((s, r) => s + (Number(r.stock) || 0), 0);
  const lowStock = inventory.filter(r => r.stock > 0 && r.stock <= LOW_STOCK_THRESHOLD).length;
  const outOfStock = inventory.filter(r => r.stock === 0).length;
  const lowStockRows = useMemo(
    () => inventory.filter(r => r.stock <= LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock).slice(0, 8),
    [inventory]
  );

  const getQty = (it: any) => Number(it.qty ?? it.quantity ?? it.count ?? 0) || 0;
  const topProducts = useMemo(() => {
    const qtyById = new Map<string, { name: string; qty: number }>();
    for (const o of ordersInRange) {
      const items: any[] = Array.isArray(o.items) ? o.items : [];
      for (const it of items) {
        const pid = String(it.productId ?? it.id ?? it.sku ?? it.name ?? 'unknown');
        const qty = getQty(it);
        const name = String(it.name ?? pid);
        const curr = qtyById.get(pid) || { name, qty: 0 };
        curr.qty += qty;
        qtyById.set(pid, curr);
      }
    }
    return Array.from(qtyById.entries())
      .map(([id, v]) => ({ id, name: v.name, qty: v.qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [ordersInRange]);

  const recentOrders = useMemo(
    () => [...orders]
      .sort((a, b) => ((orderDateOf(b)?.getTime() || 0) - (orderDateOf(a)?.getTime() || 0)))
      .slice(0, 8),
    [orders]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as any)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <Button variant="outline" onClick={refresh}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {err && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* KPI cards (with inventory) */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Sales</span>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold">{currency(grossSalesTotal)}</div>
          <div className="mt-1 text-xs text-gray-500">Gross sales in range</div>
          <div className="mt-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Revenue received</span>
              <span className="font-semibold">{currency(revenueReceivedTotal)}</span>
            </div>
          </div>
          <div className="mt-3">
            <Sparkline values={timeline.map(t => t.total)} />
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Orders</span>
            <ShoppingBag className="h-5 w-5 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold">{orderCount}</div>
          <div className="mt-2 text-xs text-gray-500">AOV: {currency(aov || 0)}</div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">New Customers</span>
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold">{customerCount}</div>
          <div className="mt-2 text-xs text-gray-500">Total Users: {users.length}</div>
        </div>

        {/* Inventory KPI */}
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Inventory</span>
            <Boxes className="h-5 w-5 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold">{totalVariants}</div>
          <div className="mt-1 text-xs text-gray-500">
            Variants • Units: <span className="font-medium">{totalUnits}</span>
          </div>
          <div className="mt-3 text-sm flex items-center justify-between">
            <span className="text-gray-600">Low / OOS</span>
            <span className="font-semibold">{lowStock} / {outOfStock}</span>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Returns</span>
            <Package className="h-5 w-5 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold">{returnsCount}</div>
          <div className="mt-2 text-xs text-gray-500">Catalog products: {products.length}</div>
        </div>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="rounded-xl border bg-white p-4 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Orders by Status</h2>
            <BarChart3 className="h-5 w-5 text-purple-600" />
          </div>
          {statusCounts.length === 0 ? (
            <div className="text-sm text-gray-500">No orders in this range.</div>
          ) : (
            <div className="space-y-3">
              {statusCounts.map(([status, count]) => (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="capitalize">{status}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded">
                    <div
                      className="h-2 bg-purple-600 rounded"
                      style={{ width: `${(count / Math.max(orderCount, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-800">Sales Timeline</h2>
            <IndianRupee className="h-5 w-5 text-purple-600" />
          </div>
          {timeline.length === 0 ? (
            <div className="text-sm text-gray-500">No data.</div>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {timeline.map((t, i) => {
                const pct = (t.total / timelineMax) * 100;
                return (
                  <div key={i} className="flex-1">
                    <div
                      className="w-full bg-purple-600 rounded-t"
                      style={{ height: `${pct}%` }}
                      title={`${t.label}: ${currency(t.total)}`}
                    />
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            {from.toLocaleDateString()} – {to.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Bottom row: Recent Orders & Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">Recent Orders</h2>
            <span className="text-xs text-gray-500">Last {Math.min(8, orders.length)} shown</span>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-sm text-gray-500">No orders yet.</div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {o.orderNumber ? `#${o.orderNumber}` : o.orderCode ? o.orderCode : o.id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {( (o.createdAt as Date) ?? (o.orderDate as Date) ?? new Date()).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{currency(Number(o.total || 0))}</div>
                    <div className="text-xs">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">
                        {o.status || 'pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Low Stock (≤ {LOW_STOCK_THRESHOLD})
            </h2>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          {lowStockRows.length === 0 ? (
            <div className="text-sm text-gray-500">All good. No low stock items.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-2">Product ID</th>
                  <th className="py-2 pr-2">Size</th>
                  <th className="py-2 pr-2 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {lowStockRows.map((r) => (
                  <tr key={`${r.productId}_${r.size}`} className="border-b last:border-0">
                    <td className="py-2 pr-2 truncate max-w-[10rem]" title={r.productId}>
                      {r.productId}
                    </td>
                    <td className="py-2 pr-2">{r.size}</td>
                    <td className="py-2 pr-2 text-right font-medium">{r.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {loading && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-white shadow px-3 py-2 text-sm text-gray-700 border">
          Loading data…
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
