import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';

const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, cartTotal, loading } = useCart();
  const { currentUser } = useAuth();

  // Logged in means NOT anonymous
  const isLoggedIn = !!currentUser && !currentUser.isAnonymous;
  const checkoutHref = isLoggedIn ? '/checkout' : '/login?redirect=/checkout';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Your cart is empty</h2>
            <p className="mt-2 text-gray-600">Start shopping to add items to your cart</p>
            <Link to="/products" className="mt-4 inline-block">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
          {currentUser?.isAnonymous && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm">
              You’re shopping as a guest. <Link className="underline" to="/login?redirect=/checkout">Verify your phone</Link> at checkout.
            </div>
          )}
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          {/* Cart Items */}
          <div className="lg:col-span-7">
            <div className="bg-white shadow-sm rounded-lg">
              <ul className="divide-y divide-gray-200">
                {cart.items.map((item) => (
                  <li key={item.id} className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <img
                          className="w-20 h-20 rounded-md object-cover"
                          src={
                            item.product?.images?.[0] ||
                            (item.product as any)?.image_url ||
                            'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg'
                          }
                          alt={item.product?.name ?? 'Cart item'}
                        />
                      </div>

                      <div className="ml-6 flex-1">
                        <div className="flex">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {item.product?.name}
                            </h4>
                            <p className="mt-1 text-sm text-gray-500">
                              Size: {item.size} | Color: {item.color}
                            </p>
                            <p className="mt-1 text-sm font-medium text-gray-900">
                              ₹{item.price.toFixed(2)}
                            </p>
                          </div>

                          <div className="ml-4 flex-shrink-0 flow-root">
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className={`flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-50 ${
                              item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>

                          <span className="mx-4 text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-16 lg:mt-0 lg:col-span-5">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Subtotal</p>
                  <p className="text-sm font-medium text-gray-900">₹{cartTotal.toFixed(2)}</p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Shipping</p>
                  <p className="text-sm font-medium text-gray-900">₹99.00</p>
                </div>

                {/* <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Tax</p>
                  <p className="text-sm font-medium text-gray-900">₹{(cartTotal * 0.18).toFixed(2)}</p>
                </div> */}

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-medium text-gray-900">Order total</p>
                    <p className="text-base font-medium text-gray-900">
                      ₹{(cartTotal + 99 ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link to={checkoutHref}>
                  <Button fullWidth size="lg">Proceed to Checkout</Button>
                </Link>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">or</p>
                <Link
                  to="/products"
                  className="text-sm font-medium text-purple-600 hover:text-purple-500"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
