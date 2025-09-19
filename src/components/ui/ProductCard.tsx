import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../types';
import Button from '../ui/Button';
import { useCart } from '../../contexts/CartContext';
import { useProductAvailability } from '../../hooks/useProductAvailability';

const FALLBACK =
  'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg';

type Props = {
  product: Product | any; // tolerate raw firestore shape
  className?: string;
};

const ProductCard: React.FC<Props> = ({ product, className }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Normalize common fields that might come as snake_case from Firestore
  const name: string =
    product?.name ?? product?.product_name ?? 'Untitled product';
  const price: number = Number(product?.price ?? 0);
  const sizes: string[] = Array.isArray(product?.sizes) ? product.sizes : [];
  const colors: string[] = Array.isArray(product?.colors) ? product.colors : [];
  const defaultColor = colors[0] || 'Black';

  const images: string[] = useMemo(() => {
    const arr = Array.isArray(product?.images) ? product.images : [];
    const cleaned = arr
      .map((s: any) => (typeof s === 'string' ? s.trim() : ''))
      .filter(Boolean);
    const single =
      typeof product?.image_url === 'string' && product.image_url.trim()
        ? [product.image_url.trim()]
        : [];
    const merged = Array.from(new Set([...cleaned, ...single]));
    return merged.length ? merged : [FALLBACK];
  }, [product]);

  const { loading, firstInStockSize, inStock } = useProductAvailability(
    product?.id,
    sizes
  );

  const canQuickAdd = inStock && !!firstInStockSize && !loading;

  const onCardClick = () => {
    if (!product?.id) return;
    navigate(`/product/${product.id}`);
  };

  const onQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canQuickAdd) return;
    await addToCart(product, firstInStockSize!, defaultColor, 1);
  };

  return (
    <div
      className={`group rounded-xl border bg-white p-3 hover:shadow-sm transition cursor-pointer ${className || ''}`}
      onClick={onCardClick}
    >
      {/* Image */}
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
        <img
          src={images[0]}
          alt={name}
          className="h-full w-full object-cover object-center group-hover:scale-[1.02] transition-transform"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="mt-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
            {name}
          </h3>
          <div className="text-sm font-semibold text-gray-900">
            ₹{price.toFixed(2)}
          </div>
        </div>

        {/* Sizes hint (optional) */}
        {sizes.length > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            Sizes: {sizes.join(' / ')}
          </div>
        )}

        {/* Quick add */}
        <Button
          className="mt-3 w-full"
          onClick={onQuickAdd}
          disabled={!canQuickAdd}
        >
          {loading ? 'Checking…' : canQuickAdd ? 'Quick add' : 'Out of stock'}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
