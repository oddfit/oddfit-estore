import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { getWishlist, removeFromWishlist, WishlistItem } from '../services/wishlist';

const FALLBACK =
  'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg';

const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToCart } = useCart();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!currentUser) { setItems([]); setLoading(false); return; }
      try {
        const rows = await getWishlist(currentUser.uid);
        setItems(rows);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser?.uid]);

  const remove = async (pid: string) => {
    if (!currentUser) return;
    await removeFromWishlist(currentUser.uid, pid);
    setItems((s) => s.filter((x) => x.id !== pid));
  };

  const moveToCart = async (it: WishlistItem) => {
    const p = it.product || {};
    await addToCart(
      { id: p.id, name: p.name, price: p.price, images: p.image ? [p.image] : [] } as any,
      'M', // default; user can edit in cart
      'Black',
      1
    );
    remove(it.id).catch(() => {});
    navigate('/cart');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Please sign in to view your wishlist</h2>
          <Button className="mt-4" onClick={() => navigate('/login?redirect=/wishlist')}>Sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Wishlist</h1>

        {loading ? (
          <div className="rounded-lg border bg-white p-6 text-gray-600">Loading…</div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border bg-white p-6 text-gray-600">
            Your wishlist is empty.
            <Button className="ml-3" onClick={() => navigate('/products')}>Browse products</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((it) => {
              const p = it.product || {};
              return (
                <div key={it.id} className="rounded-lg border bg-white p-3">
                  <div className="aspect-square w-full overflow-hidden rounded-md bg-gray-100">
                    <img
                      src={p.image || FALLBACK}
                      alt={p.name || 'Product'}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="mt-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {p.name || 'Product'}
                        </h3>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        ₹{Number(p.price ?? 0).toFixed(2)}
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button className="flex-1" onClick={() => moveToCart(it)}>Add to cart</Button>
                      <button
                        className="px-3 py-2 text-sm border rounded-md text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => remove(it.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
