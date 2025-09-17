import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  Heart,
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Images,
} from 'lucide-react';
import { Product } from '../types';
import { productsService } from '../services/firestore';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { toJsDate } from '../hooks/useCategories';

const FALLBACK =
  'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg';

// Extend Product locally so we can show extra fields without changing your central type file.
type ExtendedProduct = Product & {
  keyFeatures?: string[];
  washCare?: string[];
  perfectFor?: string[];
};

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ExtendedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  // FAQ-like collapsibles
  const [open, setOpen] = useState<{ [key: string]: boolean }>({
    keyFeatures: false,   // open Key features by default
    washCare: false,
    perfectFor: false,
  });

  const { addToCart } = useCart();
  const { currentUser } = useAuth(); // guests allowed here

  const toggle = (section: keyof typeof open) =>
    setOpen((s) => ({ ...s, [section]: !s[section] }));

  // Helpers
  const flat = (arr: any[]): string[] =>
    Array.isArray(arr)
      ? (arr as any[]).flat
        ? (arr as any[]).flat(2)
        : arr.reduce<string[]>((acc, v) => acc.concat(Array.isArray(v) ? flat(v) : v), [])
      : [];

  const toImages = (doc: any): string[] => {
    const fromArray = Array.isArray(doc.images) ? flat(doc.images) : [];
    const cleanedArray = fromArray
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter(Boolean);
    const single =
      typeof doc.image_url === 'string' && doc.image_url.trim()
        ? [doc.image_url.trim()]
        : [];
    const merged = Array.from(new Set([...cleanedArray, ...single]));
    return merged.length ? merged : [FALLBACK];
  };

  const toStringArray = (val: any): string[] => {
    if (Array.isArray(val)) {
      return val.map(String).map(s => s.trim()).filter(Boolean);
    }
    if (typeof val === 'string') {
      // Normalize line endings
      const lines = val.replace(/\r\n/g, '\n').split('\n');

      const out: string[] = [];
      let buf: string[] = [];

      for (let raw of lines) {
        let line = raw.trim();

        // Blank line => end current bullet
        if (!line) {
          if (buf.length) {
            out.push(buf.join(' '));
            buf = [];
          }
          continue;
        }

        // If a new line starts with a bullet marker, start a new bullet
        if (/^[-*•\u2022]\s+/.test(line)) {
          if (buf.length) {
            out.push(buf.join(' '));
            buf = [];
          }
          line = line.replace(/^[-*•\u2022]\s+/, '');
        }

        // Otherwise treat it as a soft wrap -> join with spaces
        buf.push(line);
      }

      if (buf.length) out.push(buf.join(' '));
      return out.filter(Boolean);
    }
    return [];
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const doc = await productsService.getById(id);

        if (doc) {
          const images = toImages(doc);

          const transformed: ExtendedProduct = {
            id: doc.id,
            name: doc.product_name,
            description: doc.description || '',
            price: doc.price || 0,
            images,
            category: doc.category || '',
            sizes: Array.isArray(doc.sizes) ? doc.sizes : [],
            colors: Array.isArray(doc.colors) ? doc.colors : [],
            stock: doc.stock || 0,
            rating: doc.rating || 0,
            reviewCount: doc.reviewCount || 0,
            featured: doc.featured || false,
            createdAt: toJsDate(doc.createdAt) || new Date(),
            updatedAt: toJsDate(doc.updatedAt) || new Date(),

            // Extra fields (supports snake_case or camelCase in Firestore)
            keyFeatures: toStringArray(doc.keyFeatures ?? doc.key_features),
            washCare: toStringArray(doc.washCare ?? doc.wash_care),
            perfectFor: toStringArray(doc.perfectFor ?? doc.perfect_for),
          };

          setProduct(transformed);

          // Preselect options if available
          setSelectedSize(transformed.sizes[0] || '');
          setSelectedColor(transformed.colors[0] || '');

          // Reset image index when product changes
          setSelectedImageIndex(0);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const canSlide = (product?.images?.length || 0) > 1;

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!product || !canSlide) return;
    setSelectedImageIndex((i) => (i + 1) % product.images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!product || !canSlide) return;
    setSelectedImageIndex((i) => (i - 1 + product.images.length) % product.images.length);
  };

  const currentImage = useMemo(
    () =>
      product?.images?.[selectedImageIndex] ||
      product?.images?.[0] ||
      FALLBACK,
    [product, selectedImageIndex]
  );

  const handleAddToCart = async () => {
    if (!product) return;
    const chosenSize = selectedSize || product.sizes?.[0] || 'M';
    const chosenColor = selectedColor || product.colors?.[0] || 'Black';

    try {
      setAddingToCart(true);
      await addToCart(product, chosenSize, chosenColor, quantity);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Product not found</h2>
          <Button onClick={() => navigate('/products')} className="mt-4">
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const hasAnyExtras =
    (product.keyFeatures && product.keyFeatures.length > 0) ||
    (product.washCare && product.washCare.length > 0) ||
    (product.perfectFor && product.perfectFor.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <button onClick={() => navigate('/products')} className="hover:text-gray-700">
            Products
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12">
          {/* Product Images */}
          <div className="mb-8 lg:mb-0">
            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4 relative">
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover"
                onClick={canSlide ? nextImage : undefined}
              />

              {canSlide && (
                <>
                  <button
                    onClick={prevImage}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 backdrop-blur border border-gray-200 p-2 shadow hover:bg-white"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/90 backdrop-blur border border-gray-200 p-2 shadow hover:bg-white"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>

                  {/* Counter */}
                  <div
                    className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-white rounded-full bg-black/60 backdrop-blur"
                    title={`${selectedImageIndex + 1} of ${product.images.length}`}
                  >
                    <Images className="h-3.5 w-3.5" />
                    {selectedImageIndex + 1}/{product.images.length}
                  </div>
                </>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-md overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-purple-600' : 'border-gray-200'
                    }`}
                    title={`Image ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {Number(product.rating ?? 0).toFixed(1)} ({product.reviewCount ?? 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-gray-900">₹{Number(product.price).toFixed(2)}</span>
            </div>

            {/* Description (always visible) */}
            {product.description && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Extra sections (FAQ-style) */}
            {hasAnyExtras && (
              <div className="space-y-3 mb-8">
                {/* Key Features */}
                {product.keyFeatures && product.keyFeatures.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                    <button
                      onClick={() => toggle('keyFeatures')}
                      className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="text-base font-semibold text-gray-900">Key features</h3>
                      {open.keyFeatures ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    {open.keyFeatures && (
                      <div className="px-6 pb-5">
                        <ul className="list-disc pl-5 space-y-1 text-gray-700">
                          {product.keyFeatures.map((li, i) => (
                            <li key={i}>{li}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Wash Care */}
                {product.washCare && product.washCare.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                    <button
                      onClick={() => toggle('washCare')}
                      className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="text-base font-semibold text-gray-900">Wash care</h3>
                      {open.washCare ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    {open.washCare && (
                      <div className="px-6 pb-5">
                        <ul className="list-disc pl-5 space-y-1 text-gray-700">
                          {product.washCare.map((li, i) => (
                            <li key={i}>{li}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Perfect For */}
                {product.perfectFor && product.perfectFor.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                    <button
                      onClick={() => toggle('perfectFor')}
                      className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="text-base font-semibold text-gray-900">Perfect for</h3>
                      {open.perfectFor ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    {open.perfectFor && (
                      <div className="px-6 pb-5">
                        <ul className="list-disc pl-5 space-y-1 text-gray-700">
                          {product.perfectFor.map((li, i) => (
                            <li key={i}>{li}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Size</h3>
                <div className="grid grid-cols-4 gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-3 px-4 text-sm font-medium rounded-lg border transition-colors ${
                        selectedSize === size
                          ? 'border-purple-600 bg-purple-50 text-purple-600'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Color</h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        selectedColor === color
                          ? 'border-purple-600 bg-purple-50 text-purple-600'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Quantity</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-lg font-medium w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex space-x-4 mb-8">
              <Button
                onClick={handleAddToCart}
                loading={addingToCart}
                disabled={product.stock === 0}
                className="flex-1 relative z-10"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Heart className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Features (shipping/returns/security) */}
            <div className="border-t pt-8">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center">
                  <Truck className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-sm text-gray-700">Free shipping on orders over ₹999</span>
                </div>
                <div className="flex items-center">
                  <RotateCcw className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-sm text-gray-700">7-day return policy</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-sm text-gray-700">Secure payment & data protection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>
  );
};

export default ProductDetailPage;
