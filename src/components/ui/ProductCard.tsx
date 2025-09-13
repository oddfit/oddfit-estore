// src/components/ui/ProductCard.tsx
import React from 'react';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  isInWishlist?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onProductClick,
  onToggleWishlist,
  isInWishlist = false,
}) => {
  const { addToCart } = useCart();
  const { currentUser } = useAuth();

  const handleAddToCart = async (e?: React.MouseEvent) => {
    // keep the image onClick from firing
    if (e) e.stopPropagation();

    // If your app always signs in anonymously on load, currentUser will exist.
    // If you still hit a rare race where it’s null, just no-op rather than navigating away.
    if (!currentUser) {
      console.warn('Auth not ready yet; try again in a second');
      return;
    }

    // Safe defaults even if sizes/colors are undefined/empty
    const defaultSize = product.sizes?.[0] ?? 'M';
    const defaultColor = product.colors?.[0] ?? 'Black';

    try {
      await addToCart(product, defaultSize, defaultColor, 1);
      console.log('Added to cart successfully');
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-200">
        <img
          src={
            (product.images && product.images[0]) ||
            (product as any).image_url ||
            'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg'
          }
          alt={product.name}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300 cursor-pointer"
          onClick={() => onProductClick(product)}
        />

        {/* Wishlist Button */}
        {onToggleWishlist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors z-10"
          >
            <Heart
              className={`h-4 w-4 ${
                isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`}
            />
          </button>
        )}

        {/* Quick Add to Cart */}
        <div
          className="
            absolute bottom-3 left-3 right-3
            z-10 pointer-events-auto
            opacity-100 md:opacity-0 md:group-hover:opacity-100
            transition-opacity duration-200
          "
        >
          <Button
            size="sm"
            fullWidth
            onClick={handleAddToCart}
            className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-200"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
        </div>

        {/* Stock Badge */}
        {product.stock === 0 && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-red-600 text-white text-xs rounded-md z-10">
            Out of Stock
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3
            className="text-sm font-medium text-gray-900 line-clamp-2 cursor-pointer hover:text-purple-600 transition-colors"
            onClick={() => onProductClick(product)}
          >
            {product.name}
          </h3>
        </div>

        {/* Rating */}
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-gray-600 ml-1">
              {Number(product.rating ?? 0).toFixed(1)} ({product.reviewCount ?? 0})
            </span>
          </div>
        </div>

        {/* Price + Sizes */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">
            ₹{Number(product.price ?? 0).toFixed(2)}
          </span>

          <div className="flex gap-1">
            {(product.sizes ?? []).slice(0, 3).map((size) => (
              <span key={size} className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
                {size}
              </span>
            ))}
            {(product.sizes?.length ?? 0) > 3 && (
              <span className="text-xs text-gray-500">
                +{(product.sizes?.length ?? 0) - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
