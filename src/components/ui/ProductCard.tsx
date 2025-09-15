// src/components/ui/ProductCard.tsx
import React, { useMemo, useState } from 'react';
import { Heart, Star, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
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

const FALLBACK =
  'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg';

function toUrl(x: unknown): string | null {
  if (typeof x !== 'string') return null;
  const s = x.trim();
  return s ? s : null;
}

function normalizeImages(p: any): string[] {
  let list: string[] = [];

  // Handle images as array
  if (Array.isArray(p?.images)) {
    list = p.images
      .flat()
      .map(toUrl)
      .filter((v): v is string => !!v);
  }

  // Handle images mistakenly stored as a single string
  if (!list.length && typeof p?.images === 'string') {
    const v = toUrl(p.images);
    if (v) list = [v];
  }

  // Legacy single URL fields
  if (!list.length) {
    const v = toUrl(p?.image_url ?? p?.imageUrl);
    if (v) list = [v];
  }

  // Another common shape
  if (!list.length && Array.isArray(p?.imageUrls)) {
    list = p.imageUrls
      .map(toUrl)
      .filter((v): v is string => !!v);
  }

  // Dedupe
  list = Array.from(new Set(list));

  // If still empty, use fallback
  return list.length ? list : [FALLBACK];
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onProductClick,
  onToggleWishlist,
  isInWishlist = false,
}) => {
  const { addToCart } = useCart();
  const { currentUser } = useAuth();

  const images = useMemo(() => normalizeImages(product as any), [product]);
  const [activeIdx, setActiveIdx] = useState(0);
  const hasMultiple = images.length > 1;

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((i) => (i - 1 + images.length) % images.length);
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((i) => (i + 1) % images.length);
  };

  const handleAddToCart = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser) return;

    const defaultSize = product.sizes?.[0] ?? 'M';
    const defaultColor = product.colors?.[0] ?? 'Black';

    try {
      await addToCart(product, defaultSize, defaultColor, 1);
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-gray-200">
        <img
          src={images[activeIdx]}
          alt={product.name}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300 cursor-pointer"
          onClick={() => onProductClick(product)}
        />

        {/* Wishlist */}
        {onToggleWishlist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors z-20"
            title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
        )}

        {/* Arrows + counter only if multiple images */}
        {hasMultiple && (
          <>
            <button
              onClick={goPrev}
              aria-label="Previous image"
              className="
                absolute left-2 top-1/2 -translate-y-1/2 z-20
                h-9 w-9 rounded-full bg-white/90 hover:bg-white
                border border-gray-200 shadow
                flex items-center justify-center
              "
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>

            <button
              onClick={goNext}
              aria-label="Next image"
              className="
                absolute right-2 top-1/2 -translate-y-1/2 z-20
                h-9 w-9 rounded-full bg-white/90 hover:bg-white
                border border-gray-200 shadow
                flex items-center justify-center
              "
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>

            <div
              className="
                absolute bottom-2 right-2 z-20
                px-2 py-0.5 rounded-md text-[11px] font-medium
                bg-black/60 text-white
              "
            >
              {activeIdx + 1}/{images.length}
            </div>
          </>
        )}

        {/* Quick Add */}
        <div
          className="
            absolute bottom-3 left-3 right-3
            z-10 pointer-events-auto
            opacity-100 md:opacity-0 md:group-hover:opacity-100
            transition-opacity duration-200
          "
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            fullWidth
            onClick={handleAddToCart}
            className="bg-[#d25c4d] text-white hover:bg-purple-600 border border-[#d25c4d]"
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

      {/* Info */}
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
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm text-gray-600 ml-1">
            {Number(product.rating ?? 0).toFixed(1)} ({product.reviewCount ?? 0})
          </span>
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
