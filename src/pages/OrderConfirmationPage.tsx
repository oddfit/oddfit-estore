import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, MapPin } from 'lucide-react';
import { ordersService } from '../services/firestore';
import { Order } from '../types';
import Button from '../components/ui/Button';

const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      try {
        const orderData = await ordersService.getById(orderId);
        if (orderData) {
          setOrder({
            id: orderData.id,
            userId: orderData.userId,
            items: orderData.items,
            total: orderData.total,
            status: orderData.status,
            paymentMethod: orderData.paymentMethod,
            shippingAddress: orderData.shippingAddress,
            billingAddress: orderData.billingAddress,
            orderDate: orderData.orderDate?.toDate() || new Date(),
            estimatedDelivery: orderData.estimatedDelivery?.toDate(),
            actualDelivery: orderData.actualDelivery?.toDate(),
            trackingNumber: orderData.trackingNumber,
            createdAt: orderData.createdAt?.toDate() || new Date(),
            updatedAt: orderData.updatedAt?.toDate() || new Date(),
          });
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
            <p className="text-sm text-gray-600">Order #{order.id}</p>
            <p className="text-sm text-gray-600">
              Placed on {order.orderDate.toLocaleDateString()}
            </p>
          </div>

          {/* Items */}
          <div className="space-y-4 mb-6">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center">
                <img
                  className="w-16 h-16 rounded-md object-cover"
                  src={item.product?.images?.[0] || (item.product as any)?.image_url || 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg'}
                  alt={item.product?.name}
                />
                <div className="ml-4 flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {item.product?.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Size: {item.size} | Color: {item.color}
                  </p>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between text-base font-medium">
              <span>Total</span>
              <span>₹{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <MapPin className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Shipping Address</h3>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium">{order.shippingAddress.name}</p>
            <p>{order.shippingAddress.phone}</p>
            <p>{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && (
              <p>{order.shippingAddress.addressLine2}</p>
            )}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <Truck className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Delivery Information</h3>
          </div>
          <div className="text-sm text-gray-600">
            <p>
              <span className="font-medium">Status:</span>{' '}
              <span className="capitalize">{order.status}</span>
            </p>
            {order.estimatedDelivery && (
              <p>
                <span className="font-medium">Estimated Delivery:</span>{' '}
                {order.estimatedDelivery.toLocaleDateString()}
              </p>
            )}
            {order.trackingNumber && (
              <p>
                <span className="font-medium">Tracking Number:</span> {order.trackingNumber}
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