import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { ordersService } from '../services/firestore';
import { Address } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const CheckoutPage: React.FC = () => {
  const { cart, clearCart, cartTotal } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const isLoggedIn = !!currentUser && !currentUser.isAnonymous;

  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<Omit<Address, 'id'>>({
    type: 'home',
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    isDefault: false,
  });
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Force login if anonymous/guest
  useEffect(() => {
    if (!isLoggedIn) navigate('/login?redirect=/checkout', { replace: true });
  }, [isLoggedIn, navigate]);

  // If still not logged in, don't render the page
  if (!isLoggedIn) return null;

  // If no cart, go back to cart
  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cart, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  const handleAddressChange = (field: keyof Address, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async () => {
    if (!currentUser || !cart || cart.items.length === 0) return;

    // Validate address
    if (
      !shippingAddress.name ||
      !shippingAddress.phone ||
      !shippingAddress.addressLine1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zipCode
    ) {
      alert('Please fill in all required address fields');
      return;
    }

    try {
      setLoading(true);

      // Minimal Firestore-safe items
      const orderItems = cart.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.product?.name ?? '',
        image: item.product?.images?.[0] ?? null, // null allowed; avoid undefined
        size: item.size ?? '',
        color: item.color ?? '',
        quantity: item.quantity ?? 1,
        price: Number(item.price ?? 0),
      }));

      // Safe address (no undefined)
      const safeAddress = {
        id: 'shipping',
        type: shippingAddress.type ?? 'home',
        name: shippingAddress.name ?? '',
        phone: shippingAddress.phone ?? '',
        addressLine1: shippingAddress.addressLine1 ?? '',
        addressLine2: shippingAddress.addressLine2 ?? '',
        city: shippingAddress.city ?? '',
        state: shippingAddress.state ?? '',
        zipCode: shippingAddress.zipCode ?? '',
        country: shippingAddress.country ?? 'India',
        isDefault: Boolean(shippingAddress.isDefault),
      };

      const subtotal = cartTotal;
      const shipping = 99;
      const tax = cartTotal * 0;
      const total = subtotal + shipping + tax;

      const orderData = {
        userId: currentUser.uid,
        items: orderItems,
        total,
        status: 'pending',
        paymentMethod,
        shippingAddress: safeAddress,
        billingAddress: safeAddress,
        orderDate: new Date(),
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      console.log('Creating order with data:', orderData);
      const orderId = await ordersService.create(orderData);
      console.log('Order created successfully with ID:', orderId);

      await clearCart();
      navigate(`/order-confirmation/${orderId}`);
    } catch (error) {
      console.error('Error placing order:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          code: (error as any).code,
          stack: error.stack
        });
        alert(`Failed to place order: ${error.message}`);
      } else {
        console.error('Unknown error:', error);
        alert('Failed to place order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cartTotal;
  const shipping = 99;
  const tax = cartTotal * 0.18;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
          {/* Checkout Form */}
          <div className="lg:col-span-7">
            <div className="space-y-8">
              {/* Shipping Address */}
              <div className="bg-white shadow-sm rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                  <h2 className="text-lg font-medium text-gray-900">Shipping Address</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Full Name"
                    value={shippingAddress.name}
                    onChange={(e) => handleAddressChange('name', e.target.value)}
                    required
                  />
                  <Input
                    label="Phone Number"
                    value={shippingAddress.phone}
                    onChange={(e) => handleAddressChange('phone', e.target.value)}
                    required
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Address Line 1"
                      value={shippingAddress.addressLine1}
                      onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="Address Line 2 (Optional)"
                      value={shippingAddress.addressLine2 || ''}
                      onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                    />
                  </div>
                  <Input
                    label="City"
                    value={shippingAddress.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    required
                  />
                  <Input
                    label="State"
                    value={shippingAddress.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    required
                  />
                  <Input
                    label="ZIP Code"
                    value={shippingAddress.zipCode}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                    required
                  />
                  <Input
                    label="Country"
                    value={shippingAddress.country}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white shadow-sm rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                  <h2 className="text-lg font-medium text-gray-900">Payment Method</h2>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-3">Credit/Debit Card</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payment"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-3">UPI</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-3">Cash on Delivery</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-8 lg:mt-0 lg:col-span-5">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-4 mb-6">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex items-center">
                    <img
                      className="w-16 h-16 rounded-md object-cover"
                      src={
                        item.product?.images?.[0] ||
                        (item.product as any)?.image_url ||
                        'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg'
                      }
                      alt={item.product?.name}
                    />
                    <div className="ml-4 flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{item.product?.name}</h4>
                      <p className="text-sm text-gray-500">
                        {item.size} | {item.color} | Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>₹{shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-medium border-t pt-2">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                fullWidth
                size="lg"
                className="mt-6"
                onClick={handlePlaceOrder}
                loading={loading}
              >
                Place Order
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
