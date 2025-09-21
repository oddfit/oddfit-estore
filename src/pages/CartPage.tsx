// src/pages/CartPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useProductAvailability } from '../hooks/useProductAvailability';
import { getShippingConfig, computeShippingFee, DEFAULT_SHIPPING_CONFIG } from '../services/shipping';

const FALLBACK =
  'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg';

const CartPage: React.FC = () => {
  // top-level hooks (always same order)
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    cart,
    cartTotal,
    removeFromCart,
    updateQuantity,
    addToCart,
    // optional; exists if you merged earlier change
    // @ts-expect-error soft-detect
    updateItemSize,
  } = useCart() as any;

  // shipping config for estimates in cart
  const [shippingConfig, setShippingConfig] = React.useState(DEFAULT_SHIPPING_CONFIG);
  React.useEffect(() => {
    (async () => {
      try {
        const cfg = await getShippingConfig();
        setShippingConfig(cfg);
      } catch (e) {
        console.error('Failed to load shipping config in cart:', e);
      }
    })();
  }, []);


  const items = cart?.items ?? [];
  const subtotal = Number(cartTotal || 0);
  const shippingFee = items.length > 0
  ? computeShippingFee(subtotal, 'standard', shippingConfig) : 0;
  const total = subtotal + shippingFee;

  const goCheckout = () => {
    if (!currentUser || (currentUser as any)?.isAnonymous) {
      navigate(`/login?redirect=/checkout`);
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Cart</h1>

        {items.length === 0 ? (
          <div className="rounded-lg border bg-white p-6 text-gray-600">
            Your cart is empty.
            <Button className="ml-3" onClick={() => navigate('/products')}>
              Continue shopping
            </Button>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
            {/* Items */}
            <div className="lg:col-span-8">
              <div className="space-y-4">
                {items.map((item: any) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onRemove={removeFromCart}
                    onQty={updateQuantity}
                    onChangeSize={typeof updateItemSize === 'function' ? updateItemSize : undefined}
                    addToCart={addToCart}
                  />
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="mt-8 lg:mt-0 lg:col-span-4">
              <div className="rounded-lg border bg-white p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Order Summary
                </h2>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>₹{shippingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold border-t pt-2">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  fullWidth
                  size="lg"
                  className="mt-6"
                  onClick={goCheckout}
                  disabled={items.length === 0}
                >
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/** Separate row component so we can safely use hooks per-item without breaking hook rules */
const CartItemRow: React.FC<{
  item: any;
  onRemove: (id: string) => Promise<void> | void;
  onQty: (id: string, qty: number) => Promise<void> | void;
  onChangeSize?: (id: string, size: string) => Promise<void> | void; // optional direct update
  addToCart: (product: any, size: string, color: string, qty?: number) => Promise<void>;
}> = ({ item, onRemove, onQty, onChangeSize, addToCart }) => {
  const product = item.product || {};
  const productId: string = product?.id || item.productId;
  const name: string = product?.name ?? product?.product_name ?? 'Product';
  const sizes: string[] = Array.isArray(product?.sizes) ? product.sizes : [];
  const images: string[] = Array.isArray(product?.images) ? product.images : [];
  const firstImage = images[0] || (product as any)?.image_url || FALLBACK;

  // per-row availability (safe to use hook here)
  const { loading, stockBySize } = useProductAvailability(productId, sizes);

  const sizeOptions = React.useMemo(() => {
    return sizes.map((s) => {
      const avail = Number(stockBySize?.[s] ?? 0);
      return {
        value: s,
        label: s,
        disabled: avail < Number(item.quantity ?? 1),
        avail,
      };
    });
  }, [sizes, stockBySize, item.quantity]);

  const handleSizeChange = async (nextSize: string) => {
    if (!nextSize) return;
    const qty = Number(item.quantity ?? 1);
    const available = Number(stockBySize?.[nextSize] ?? 0);
    if (available < qty) {
      alert(`Only ${available} in stock for size ${nextSize}. Reduce quantity first.`);
      return;
    }

    try {
      // Prefer direct in-place update if your CartContext exposes it
      if (onChangeSize) {
        await onChangeSize(item.id, nextSize);
        return;
      }
      // Fallback: remove + re-add (preserves quantity)
      await onRemove(item.id);
      await addToCart(product, nextSize, item.color, qty);
    } catch (e: any) {
      console.error('Failed to change size:', e);
      alert(e?.message || 'Could not change size. Please try again.');
    }
  };

  return (
    <div className="rounded-lg border bg-white p-4 flex gap-4 items-start">
      <img
        src={firstImage}
        alt={name}
        className="w-24 h-24 rounded-md object-cover"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">{name}</h3>
            {product?.category && (
              <div className="text-xs text-gray-500 mt-0.5">{product.category}</div>
            )}
          </div>
          <div className="text-sm font-semibold text-gray-900">
            ₹{Number(item.price ?? 0).toFixed(2)}
          </div>
        </div>

        {/* Size + Color + Quantity */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Size selector (editable) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Size
            </label>
            {sizes.length === 0 ? (
              <div className="text-sm text-gray-500">—</div>
            ) : (
              <select
                value={item.size}
                onChange={(e) => handleSizeChange(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                title={loading ? 'Checking availability…' : undefined}
              >
                {sizeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}{opt.disabled ? ' — out of stock for this qty' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Color (read-only here) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Color
            </label>
            <div className="text-sm text-gray-800 border rounded-lg px-3 py-2 bg-gray-50">
              {item.color || '—'}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Quantity
            </label>
            <div className="flex items-center">
              <button
                className="w-8 h-8 rounded-l-lg border border-gray-300 hover:bg-gray-50"
                onClick={() =>
                  onQty(item.id, Math.max(1, Number(item.quantity ?? 1) - 1))
                }
              >
                –
              </button>
              <div className="w-10 text-center text-sm border-t border-b border-gray-300 py-1">
                {item.quantity}
              </div>
              <button
                className="w-8 h-8 rounded-r-lg border border-gray-300 hover:bg-gray-50"
                onClick={() => {
                  const avail = Number((stockBySize || {})[item.size] ?? 0);
                  const next = Number(item.quantity ?? 1) + 1;
                  if (avail > 0 && next > avail) {
                    alert(`Only ${avail} in stock for size ${item.size}.`);
                    return;
                  }
                  onQty(item.id, next);
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trash icon to delete */}
      <button
        aria-label="Remove item"
        title="Remove"
        onClick={() => onRemove(item.id)}
        className="p-2 rounded hover:bg-gray-100 border border-transparent hover:border-gray-200 transition"
      >
        <Trash2 className="h-5 w-5 text-gray-600" />
      </button>
    </div>
  );
};

export default CartPage;
