// src/services/orders.ts
import { ordersService, usersService, getNextSequence } from './firestore';

type OrderItem = { productId?: string; name: string; qty: number; price: number };

// Customize these if you ever need:
const ORDER_PREFIX = 'OD';
const SEQ_PAD = 6; // 100001 -> "100001" (pad to 6 digits so lower seeds look nice too)

function formatOrderCode(seq: number, year = new Date().getFullYear()) {
  // OD + 2025 + 100001 => OD2025100001
  return `${ORDER_PREFIX}${year}${String(seq).padStart(SEQ_PAD, '0')}`;
}

export async function createOrderWithAutoNumber(params: {
  userId: string;
  items: OrderItem[];
  total: number;
  status?: string;
  extra?: Record<string, any>;
}) {
  const { userId, items, total, status = 'pending', extra = {} } = params;

  // 1) Next sequential number from counters/orders
  // Make sure Firestore doc exists: counters/orders { value: 100000, updatedAt: serverTime }
  const orderNumber = await getNextSequence('orders'); // e.g. 100001

  // 2) Human-friendly code with year
  const orderCode = formatOrderCode(orderNumber); // e.g. OD2025100001

  // 3) Denormalize customer name for easy listing
  let customerName = 'Customer';
  try {
    const userDoc = await usersService.getById(userId);
    customerName =
      (userDoc?.name as string) ||
      (userDoc?.displayName as string) ||
      (userDoc?.phone as string) ||
      'Customer';
  } catch {
    /* ignore lookup failures */
  }

  // 4) Create order document
  const id = await ordersService.create({
    orderNumber,          // numeric sequence (e.g. 100001)
    orderCode,            // display code (e.g. OD2025100001)
    userId,
    customerName,
    items,
    total,
    status,
    ...extra,             // you’re already passing orderDate, addresses, etc.
  });

  return id;
}
