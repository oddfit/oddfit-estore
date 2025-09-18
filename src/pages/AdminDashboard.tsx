// src/pages/AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp, ShoppingBag, Users, RefreshCcw, Package, IndianRupee, BarChart3, Clock,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { ordersService, productsService, usersService, returnsService } from '../services/firestore';
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
  items?: any[]; // we’ll normalize
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

function currency(n: number) {
  return `₹${n.toFixed(2)}`;
}

function isRevenueOrder(o: AnyOrder) {
  const status = (o.status || '').toLowerCase();
  const pay = (o.paymentStatus || '').toLowerCase();
  // Count revenue for paid or moving/fulfilled orders; exclude cancelled
  if (pay === 'paid') return true;
  if (['paid', 'processing', 'shipped', 'delivered'].includes(status)) return true;
  return false;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function sameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function dateInRange(d: Date, from: Date, to: Date) {
  const t = d.getTime();
  return t >= from.getTime() && t <= to.getTime();
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** tiny sparkline */
const Sparkline: React.FC<{ values: number[] }> = ({ values }) => {
  if (!values.length) return null;
  const w = 160;
  const h = 40;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const step = values.length > 1 ? w / (values.length - 1) : w;

  const pts = values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / span) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={pts}
        className="text-purple-600"
      />
    </svg>
  );
};

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [orders, setOrders] = useState<AnyOrder[]>([]);
  const [products, setProducts] = useState<AnyProduct[]>([]);
  const [users, setUsers] = useState<AnyUser[]>([]);
  const [returns, setReturns] = useState<AnyReturn[]>([]);
  const [range, setRange] = useState<'7d' | '30d'>('7d');

  const refresh = async () => {
    try {
      setLoading(true);
      setErr('');
      const [o, p, u, r] = await Promise.all([
        ordersService.getAll(), productsService.getAll(), usersService.getAll(), returnsService.getAll(),
      ]);

      // normalize orders
      setOrders(
        (o as any[]).map((x) => ({
          ...x,
          createdAt: toJsDate(x.createdAt) || new Date(),
        }))
      );
      setProducts(p as any[]);
      setUsers(
        (u as any[]).map((x) => ({ ...x, createdAt: toJsDate(x.createdAt) || null }))
      );
      setReturns(
        (r as any[]).map((x) => ({ ...x, createdAt: toJsDate(x.createdAt) || null }))
      );
    } catch (e: any) {
      console.error(e);
      setErr(e?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  // Time window
  const to = new Date();
  const from = useMemo(() => (range === '7d' ? daysAgo(6) : daysAgo(29)), [range]);
  from.setHours(0, 0, 0, 0);

  // Derived metrics
  const ordersInRange = useMemo(
    () => orders.filter((o) => {
      const d = toJsDate(o.createdAt) || new Date();
      return dateInRange(d, from, to);
    }),
    [orders, from, to]
  );

  const revenueOrders = useMemo(() => ordersInRange.filter(isRevenueOrder), [ordersInRange]);
  const revenueTotal = revenueOrders.reduce((s, o) => s + (Number(o.total) || 0), 0);

  const today = startOfDay(new Date());
  const revenueToday = revenueOrders
    .filter((o) => sameDay(toJsDate(o.createdAt) || new Date(), today))
    .reduce((s, o) => s + (Number(o.total) || 0), 0);

  const orderCount = ordersInRange.length;
  const customerCount = users.filter((u) => u.createdAt && dateInRange(toJsDate(u.createdAt)!, from, to)).length;
  const returnsCount = returns.filter((r) => r.createdAt && dateInRange(toJsDate(r.createdAt)!, from, to)).length;

  const aov = orderCount ? revenueTotal / Math.max(revenueOrders.length, 1) : 0;

  // Orders by status
  const statusCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of ordersInRange) {
      const s = (o.status || 'pending').toLowerCase();
      map.set(s, (map.get(s) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [ordersInRange]);

  // Sales timeline (per day)
  const days = range === '7d' ? 7 : 30;
  const timeline = useMemo(() => {
    const buckets: { label: string; date: Date; total: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = startOfDay(daysAgo(i));
      buckets.push({ label: d.toLocaleDateString(), date: d, total: 0 });
    }
    for (const o of revenueOrders) {
      const d = startOfDay(toJsDate(o.createdAt) || new Date());
      const b = buckets.find((x) => x.date.getTime() === d.getTime());
      if (b) b.total += Number(o.total) || 0;
    }
    return buckets;
  }, [revenueOrders, range]);

  // Top products (by qty)
  const topProducts = useMemo(() => {
    const qtyById = new Map<string, { name: string; qty: number }>();
    for (const o of ordersInRange) {
      const items: any[] = Array.isArray(o.items) ? o.items : [];
      for (const it of items) {
        const pid = String(it.productId ?? it.id ?? it.sku ?? it.name ?? 'unknown');
        const qty = Number(it.qty ?? it.quantity ?? 0) || 0;
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
    () =>
      [...orders]
        .sort((a, b) => (toJsDate(b.createdAt)?.getTime() || 0) - (toJsDate(a.createdAt)?.getTime() || 0))
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

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Revenue ({range})</span>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold">{currency(revenueTotal)}</div>
          <div className="mt-2 text-xs text-gray-500">Today: {currency(revenueToday)}</div>
          <div className="mt-3">
            <Sparkline values={timeline.map((t) => t.total)} />
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Orders ({range})</span>
            <ShoppingBag className="h-5 w-5 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold">{orderCount}</div>
          <div className="mt-2 text-xs text-gray-500">AOV: {currency(aov || 0)}</div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">New Customers ({range})</span>
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold">{customerCount}</div>
          <div className="mt-2 text-xs text-gray-500">Total Users: {users.length}</div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Returns ({range})</span>
            <Package className="h-5 w-5 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold">{returnsCount}</div>
          <div className="mt-2 text-xs text-gray-500">Products: {products.length}</div>
        </div>
      </div>

      {/* Middle row: Status & Sales timeline */}
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
                      style={{
                        width: `${(count / Math.max(orderCount, 1)) * 100}%`,
                      }}
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
                const max = Math.max(...timeline.map((x) => x.total), 1);
                const pct = (t.total / max) * 100;
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

      {/* Bottom row: Recent Orders & Top Products */}
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
                      {(toJsDate(o.createdAt) || new Date()).toLocaleString()}
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
            <h2 className="text-sm font-semibold text-gray-800">Top Products</h2>
            <span className="text-xs text-gray-500">{range === '7d' ? '7-day' : '30-day'}</span>
          </div>
          {topProducts.length === 0 ? (
            <div className="text-sm text-gray-500">No product sales in this range.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-2">Product</th>
                  <th className="py-2 pr-2 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-2">{p.name}</td>
                    <td className="py-2 pr-2 text-right font-medium">{p.qty}</td>
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
