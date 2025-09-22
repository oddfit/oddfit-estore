// src/pages/OrderConfirmationPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Truck, MapPin } from 'lucide-react';
import { ordersService } from '../services/firestore';
import { Order } from '../types';
import Button from '../components/ui/Button';
import { toJsDate } from '../hooks/useCategories';

const FALLBACK =
  'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg';

const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | (Order & any) | null>(null);
  const [loading, setLoading] = useState(true);
  // Read shipping from root (new) or from extra.shipping (legacy)
  const shipping: any =
    (order as any)?.shipping ?? (order as any)?.extra?.shipping ?? {};
  const shippingFee = Number(shipping?.fee ?? 0);
  const shippingMethod = String(shipping?.method ?? 'standard');

  // const total = Number(order?.total ?? 0);
  // const subtotal = Math.max(0, total - shippingFee);
  
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        setLoading(true);
        const data: any = await ordersService.getById(orderId);
        if (data) {
          // Normalize timestamps safely
          const normalized = {
            ...data,
            id: data.id,
            orderDate: toJsDate(data.orderDate) || new Date(),
            estimatedDelivery: data.estimatedDelivery
              ? toJsDate(data.estimatedDelivery)
              : undefined,
            actualDelivery: data.actualDelivery
              ? toJsDate(data.actualDelivery)
              : undefined,
            createdAt: toJsDate(data.createdAt) || new Date(),
            updatedAt: toJsDate(data.updatedAt) || new Date(),
          };
          setOrder(normalized as Order);
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // Helpers to handle various item shapes
  const items: any[] = useMemo(() => {
    if (!order?.items) return [];
    return Array.isArray(order.items) ? order.items : Object.values(order.items);
  }, [order]);

  const getItemKey = (it: any, idx: number) =>
    it?.id || it?.productId || it?.sku || `${it?.name || 'item'}-${idx}`;

  const getItemName = (it: any) =>
    it?.name || it?.product?.name || 'Item';

  const getItemQty = (it: any) =>
    Number(it?.quantity ?? it?.qty ?? 1);

  const getItemPrice = (it: any) =>
    Number(it?.price ?? it?.unitPrice ?? it?.amount ?? 0);

  const getItemImage = (it: any) =>
    it?.image ||
    it?.product?.images?.[0] ||
    (it?.product as any)?.image_url ||
    FALLBACK;

  const derivedSubtotal = useMemo(
    () =>
      items.reduce((sum, it) => sum + getItemQty(it) * getItemPrice(it), 0),
    [items]
  );

  const subtotal = derivedSubtotal;
  const total = subtotal + shippingFee;
  const displayOrderCode =
    (order as any)?.orderCode ||
    (order as any)?.orderNumber ||
    order?.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Order not found</h2>
          <Link to="/" className="mt-4 inline-block">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Order Confirmed!</h1>
          <p className="mt-2 text-lg text-gray-600">
            Thank you for your purchase. Your order has been placed successfully.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <div className="border-b pb-4 mb-4">
            <h2 className="text-lg font-medium text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-600">
              Order #{String(displayOrderCode)}
            </p>
            <p className="text-sm text-gray-600">
              Placed on {new Date(order.orderDate as any).toLocaleDateString()}
            </p>
          </div>

          {/* Items */}
          <div className="space-y-4 mb-6">
            {items.map((item, idx) => {
              const qty = getItemQty(item);
              const price = getItemPrice(item);
              return (
                <div key={getItemKey(item, idx)} className="flex items-center">
                  <img
                    className="w-16 h-16 rounded-md object-cover"
                    src={getItemImage(item)}
                    alt={getItemName(item)}
                  />
                  <div className="ml-4 flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {getItemName(item)}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {item.size ? `Size: ${item.size}` : null}
                      {item.size && item.color ? ' | ' : null}
                      {item.color ? `Color: ${item.color}` : null}
                    </p>
                    <p className="text-sm text-gray-500">Quantity: {qty}</p>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    ₹{(price * qty).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Summary (Subtotal + Shipping + Total) */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>
                Shipping
                {shippingMethod
                  ? ` (${shippingMethod.charAt(0).toUpperCase() + shippingMethod.slice(1)})`
                  : ''}
              </span>
              <span>₹{shippingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold border-t pt-2">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Shipping Address</h3>
            </div>
            <div className="text-sm text-gray-600">
              {order.shippingAddress.name && (
                <p className="font-medium">{order.shippingAddress.name}</p>
              )}
              {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
              {order.shippingAddress.addressLine1 && (
                <p>{order.shippingAddress.addressLine1}</p>
              )}
              {order.shippingAddress.addressLine2 && (
                <p>{order.shippingAddress.addressLine2}</p>
              )}
              <p>
                {[order.shippingAddress.city, order.shippingAddress.state]
                  .filter(Boolean)
                  .join(', ')}{' '}
                {order.shippingAddress.zipCode}
              </p>
              {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
            </div>
          </div>
        )}

        {/* Delivery Info */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <Truck className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Delivery Information</h3>
          </div>
          <div className="text-sm text-gray-600">
            {(order as any).status && (
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span className="capitalize">{(order as any).status}</span>
              </p>
            )}
            {(order as any).estimatedDelivery && (
              <p>
                <span className="font-medium">Estimated Delivery:</span>{' '}
                {new Date((order as any).estimatedDelivery).toLocaleDateString()}
              </p>
            )}
            {(order as any).trackingNumber && (
              <p>
                <span className="font-medium">Tracking Number:</span>{' '}
                {(order as any).trackingNumber}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/orders">
            <Button variant="outline">View All Orders</Button>
          </Link>
          <Link to="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;