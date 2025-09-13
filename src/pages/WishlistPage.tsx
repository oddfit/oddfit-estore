import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types';
import ProductCard from '../components/ui/ProductCard';
import Button from '../components/ui/Button';

const WishlistPage: React.FC = () => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    // For now, we'll use localStorage for wishlist
    // In a real app, this would be stored in Firestore
    const loadWishlist = () => {
      if (!currentUser) {
        setWishlistItems([]);
        setLoading(false);
        return;
      }

      try {
        const saved = localStorage.getItem(`wishlist_${currentUser.uid}`);
        if (saved) {
          setWishlistItems(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading wishlist:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [currentUser]);

  const removeFromWishlist = (productId: string) => {
    if (!currentUser) return;

    const updatedItems = wishlistItems.filter(item => item.id !== productId);
    setWishlistItems(updatedItems);
    localStorage.setItem(`wishlist_${currentUser.uid}`, JSON.stringify(updatedItems));
  };

  const handleProductClick = (product: Product) => {
    window.location.href = `/product/${product.id}`;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Please sign in</h2>
          <p className="mt-2 text-gray-600">You need to be logged in to view your wishlist</p>
          <Link to="/login" className="mt-4 inline-block">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600 mt-2">
              {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Your wishlist is empty</h2>
            <p className="mt-2 text-gray-600">Save items you love to view them later</p>
            <Link to="/products" className="mt-4 inline-block">
              <Button>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {wishlistItems.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onProductClick={handleProductClick}
                onToggleWishlist={() => removeFromWishlist(product.id)}
                isInWishlist={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;