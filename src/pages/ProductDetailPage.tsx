import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  Heart,
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw,
  ChevronRight,
  Plus,
  Minus,
} from 'lucide-react';
import { Product } from '../types';
import { productsService } from '../services/firestore';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { toJsDate } from '../hooks/useCategories';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  const { addToCart } = useCart();
  const { currentUser } = useAuth(); // we allow guests on PDP; keep for later use if needed

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const productData = await productsService.getById(id);

        if (productData) {
          const transformedProduct: Product = {
            id: productData.id,
            name: productData.product_name,
            description: productData.description || '',
            price: productData.price || 0,
            images: productData.image_url ? [productData.image_url] : [],
            category: productData.category || '',
            sizes: productData.sizes || [],
            colors: productData.colors || [],
            stock: productData.stock || 0,
            rating: productData.rating || 0,
            reviewCount: productData.reviewCount || 0,
            featured: productData.featured || false,
            createdAt: toJsDate(productData.createdAt) || new Date(),
            updatedAt: toJsDate(productData.updatedAt) || new Date(),
          };

          setProduct(transformedProduct);
          // Preselect first options if available
          setSelectedSize(transformedProduct.sizes[0] || '');
          setSelectedColor(transformedProduct.colors[0] || '');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;

    // Fallbacks so button is always usable even when sizes/colors are missing in Firestore
    const chosenSize = selectedSize || product.sizes?.[0] || 'M';
    const chosenColor = selectedColor || product.colors?.[0] || 'Black';

    try {
      setAddingToCart(true);
      await addToCart(product, chosenSize, chosenColor, quantity);
      // optional: navigate('/cart'); or show a toast
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
                src={
                  product.images[selectedImageIndex] ||
                  'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg'
                }
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {/* If you have any overlays, ensure they don't block clicks */}
              {/* <div className="absolute inset-0 pointer-events-none" /> */}
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
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
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
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
              <span className="ml-2 text-sm text-gray-500">inclusive of all taxes</span>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

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
                disabled={product.stock === 0} // <— allow click even if size/color arrays are empty
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

            {/* Features */}
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
