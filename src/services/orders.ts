// src/services/orders.ts
import { ordersService, usersService, getNextSequence, formatSequence } from './firestore';

type OrderItem = { productId?: string; name: string; qty: number; price: number };

export async function createOrderWithAutoNumber(params: {
  userId: string;
  items: OrderItem[];
  total: number;
  status?: string;
  extra?: Record<string, any>;
}) {
  const { userId, items, total, status = 'pending', extra = {} } = params;

  // 1) Sequential number + display code
  const orderNumber = await getNextSequence('orders');      // e.g. 100001
  const orderCode = formatSequence('ODF', orderNumber);     // e.g. ODF-100001

  // 2) Denormalize customer name for easy listing
  let customerName = 'Customer';
  try {
    const userDoc = await usersService.getById(userId);
    customerName =
      (userDoc?.name as string) ||
      (userDoc?.displayName as string) ||
      (userDoc?.phone as string) ||
      'Customer';
  } catch { /* ignore */ }

  // 3) Create
  const id = await ordersService.create({
    orderNumber,
    orderCode,
    userId,
    customerName,
    items,
    total,
    status,
    ...extra,
  });

  return id; // FirestoreService.create returns the new doc ID
}
