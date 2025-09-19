import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { createOrderWithAutoNumber } from '../services/orders';
import { Address } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
  getAddresses,
  createAddress,
  setDefaultAddress,
} from '../services/addresses';

// ⬇️ inventory: atomic decrements to prevent oversell
import { decrementBatch } from '../services/inventory';

type AddressForm = Omit<Address, 'id'>;

const emptyAddress: AddressForm = {
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
};

const CheckoutPage: React.FC = () => {
  const { cart, clearCart, cartTotal } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const isLoggedIn = !!currentUser && !currentUser.isAnonymous;

  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');

  // New/editing address form (used when "New address" is selected)
  const [shippingAddress, setShippingAddress] = useState<AddressForm>(emptyAddress);
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [makeDefault, setMakeDefault] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'cod'>('card');

  // Force login if anonymous/guest
  useEffect(() => {
    if (!isLoggedIn) navigate('/login?redirect=/checkout', { replace: true });
  }, [isLoggedIn, navigate]);

  // If still not logged in, don't render the page
  if (!isLoggedIn) return null;

  // If no cart, go back to cart (unless we just placed an order)
  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      if (!placingOrder) navigate('/cart', { replace: true });
    }
  }, [cart, placingOrder, navigate]);

  // Load saved addresses
  useEffect(() => {
    (async () => {
      if (!currentUser) return;
      try {
        const list = await getAddresses(currentUser.uid);
        setSavedAddresses(list);
        // Pick default if available, else first
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) {
          setSelectedAddressId(def.id);
        } else {
          setSelectedAddressId('new');
        }
      } catch (e) {
        console.error('Failed to load addresses:', e);
      }
    })();
  }, [currentUser]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  const selectedSavedAddress = useMemo(
    () => (typeof selectedAddressId === 'string' && selectedAddressId !== 'new'
      ? savedAddresses.find((a) => a.id === selectedAddressId)
      : undefined),
    [selectedAddressId, savedAddresses]
  );

  const handleAddressChange = (field: keyof Address, value: string | boolean) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value } as AddressForm));
  };

  const handlePlaceOrder = async () => {
    if (!currentUser || !cart || cart.items.length === 0) return;

    // 1) Determine which address to use
    let effective: AddressForm | null = null;

    if (selectedSavedAddress) {
      // Use saved address
      const { id: _id, ...rest } = selectedSavedAddress;
      effective = rest;
    } else {
      // Use "new" address from form
      const a = shippingAddress;
      if (
        !a.name || !a.phone || !a.addressLine1 ||
        !a.city || !a.state || !a.zipCode
      ) {
        alert('Please fill in all required address fields');
        return;
      }
      effective = a;
    }

    try {
      setLoading(true);
      setPlacingOrder(true);

      // ⬇️ 2) Atomically decrement inventory for each line-item.
      //     Throws if any row would go negative or doesn't exist.
      await decrementBatch(
        cart.items.map((it) => {
          if (!it.size) throw new Error('Missing size for an item in the cart.');
          return {
            productId: it.productId,
            size: it.size,
            qty: it.quantity ?? 1,
          };
        })
      );

      // 3) Build order items (carry qty + price)
      const orderItems = cart.items.map((item) => {
        const imgs = Array.isArray(item.product?.images) ? item.product.images : [];
        const firstImage = imgs[0] || (item.product as any)?.image_url || null;
        const qty = item.quantity ?? item.qty ?? 1;

        return {
          id: item.id,
          productId: item.productId,
          name: item.product?.name ?? '',
          image: firstImage,
          size: item.size ?? '',
          color: item.color ?? '',
          qty,
          price: Number(item.price ?? 0),
        };
      });

      const subtotal = cartTotal;
      const shippingFee = 99;
      const total = subtotal + shippingFee;

      // 4) Create order with auto number
      const orderId = await createOrderWithAutoNumber({
        userId: currentUser.uid,
        items: orderItems.map(({ productId, name, image, qty, price }) => ({
          productId,
          name,
          image: image || null,
          qty,
          price,
        })),
        total,
        status: 'pending',
        extra: {
          paymentMethod,
          shippingAddress: effective!,
          billingAddress: effective!,
          orderDate: new Date(),
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // 5) Go to confirmation and clear cart (do not bounce to /cart)
      navigate(`/order-confirmation/${orderId}`, { replace: true });
      clearCart().catch(console.error);
    } catch (error: any) {
      console.error('Error placing order:', error);
      alert(`Failed to place order: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cartTotal;
  const shippingFee = 99;
  const total = subtotal + shippingFee;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
          {/* Checkout Form */}
          <div className="lg:col-span-7">
            <div className="space-y-8">
              {/* Address chooser */}
              <div className="bg-white shadow-sm rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                  <h2 className="text-lg font-medium text-gray-900">Shipping Address</h2>
                </div>

                {/* Saved addresses */}
                {savedAddresses.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <h3 className="text-sm font-medium text-gray-700">Choose a saved address</h3>
                    <div className="space-y-2">
                      {savedAddresses.map((a) => (
                        <label
                          key={a.id}
                          className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            className="mt-1"
                            name="addr"
                            checked={selectedAddressId === a.id}
                            onChange={() => setSelectedAddressId(a.id)}
                          />
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {a.name}{' '}
                              {a.isDefault && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-gray-600">{a.phone}</div>
                            <div className="text-gray-600">{a.addressLine1}</div>
                            {a.addressLine2 && <div className="text-gray-600">{a.addressLine2}</div>}
                            <div className="text-gray-600">
                              {a.city}, {a.state} {a.zipCode}, {a.country}
                            </div>
                          </div>
                        </label>
                      ))}

                      <label className="flex items-center gap-2 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="addr"
                          checked={selectedAddressId === 'new'}
                          onChange={() => setSelectedAddressId('new')}
                        />
                        <span className="text-sm text-gray-700">Use a new address</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* New address form */}
                {selectedAddressId === 'new' && (
                  <>
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

                    <div className="mt-4 flex flex-col sm:flex-row gap-4">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={saveNewAddress}
                          onChange={(e) => setSaveNewAddress(e.target.checked)}
                        />
                        <span className="text-sm text-gray-700">Save this address to my account</span>
                      </label>

                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={makeDefault}
                          onChange={(e) => setMakeDefault(e.target.checked)}
                          disabled={!saveNewAddress}
                        />
                        <span className={`text-sm ${saveNewAddress ? 'text-gray-700' : 'text-gray-400'}`}>
                          Make this my default address
                        </span>
                      </label>
                    </div>
                  </>
                )}
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
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
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
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-3">UPI</span>
                  </label>
                  {/* <label className="flex items-center">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-3">Cash on Delivery</span>
                  </label> */}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-8 lg:mt-0 lg:col-span-5">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

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

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>₹{shippingFee.toFixed(2)}</span>
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
