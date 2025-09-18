// src/components/ui/ProductCard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Heart, Star, ShoppingCart, ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';
import { useLocation, useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  isInWishlist?: boolean;
}

const FALLBACK =
  'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg';

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onProductClick,
  onToggleWishlist,
  isInWishlist = false,
}) => {
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Prefer product.images[], else single image_url, else fallback
  const imgs = useMemo(() => {
    const fromArray =
      Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    if (fromArray.length) return fromArray as string[];
    const single = (product as any).image_url as string | undefined;
    return single ? [single] : [];
  }, [product]);

  const [idx, setIdx] = useState(0);
  const canSlide = imgs.length > 1;
  const showSrc = imgs.length ? imgs[idx] : FALLBACK;

  // If imgs change (or go from 1 -> many), reset index
  useEffect(() => {
    setIdx(0);
  }, [imgs.length]);

  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!canSlide) return;
    setIdx((i) => (i + 1) % imgs.length);
  };
  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!canSlide) return;
    setIdx((i) => (i - 1 + imgs.length) % imgs.length);
  };

  const handleAddToCart = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isAnon = (currentUser as any)?.isAnonymous === true;
    if (!currentUser || isAnon) {
      const redirect = location.pathname + location.search + location.hash;
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    const defaultSize = product.sizes?.[0] ?? 'M';
    const defaultColor = product.colors?.[0] ?? 'Black';
    await addToCart(product, defaultSize, defaultColor, 1);
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-gray-200">
        <img
          src={showSrc}
          alt={product.name}
          className="w-full h-full object-cover object-top transition-transform duration-300 cursor-pointer group-hover:scale-105"
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
            title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart
              className={`h-4 w-4 ${
                isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`}
            />
          </button>
        )}

        {/* Arrows (only when multiple images) */}
        {canSlide && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 backdrop-blur border border-gray-200 p-1.5 shadow hover:bg-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 backdrop-blur border border-gray-200 p-1.5 shadow hover:bg-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Quick Add */}
        <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-auto opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
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

        {/* Stock */}
        {product.stock === 0 && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-red-600 text-white text-xs rounded-md z-20">
            Out of Stock
          </div>
        )}

        {/* Image count badge */}
        {canSlide && (
          <div
            className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-white rounded-full bg-black/60 backdrop-blur"
            title={`${idx + 1} of ${imgs.length}`}
          >
            <Images className="h-3.5 w-3.5" />
            {idx + 1}/{imgs.length}
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

        <div className="flex items-center mb-2">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm text-gray-600 ml-1">
            {Number(product.rating ?? 0).toFixed(1)} ({product.reviewCount ?? 0})
          </span>
        </div>

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
              <span className="text-xs text-gray-500">+{(product.sizes?.length ?? 0) - 3}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
