import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Star, ArrowRight, TrendingUp } from 'lucide-react';
import { Product } from '../types';
import ProductCard from '../components/ui/ProductCard';
import Button from '../components/ui/Button';
import { useCategories } from '../hooks/useCategories';
import { productsService } from '../services/firestore';
import { Sparkles } from "lucide-react";
{/* Reasons to Love Us */}
import { Ruler, Feather, Move, Receipt } from 'lucide-react';
import { ReceiptText, IndianRupee } from 'lucide-react';

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const { categories, loading: categoriesLoading } = useCategories();

  // Fetch featured products from Firestore
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setProductsLoading(true);
        const featuredProductsData = await productsService.query(
          [{ field: 'featured', operator: '==', value: true }],
          undefined,
          'asc',
          8
        );

        // Transform Firestore data to match Product interface
        const transformedProducts = featuredProductsData.map((doc: any) => ({
          id: doc.id,
          name: doc.product_name,
          description: doc.description,
          price: doc.price,
          images: doc.image_url ? [doc.image_url] : [],
          category: doc.category,
          sizes: doc.sizes || [],
          colors: doc.colors || [],
          stock: doc.stock || 0,
          rating: doc.rating || 0,
          reviewCount: doc.reviewCount || 0,
          featured: doc.featured || false,
          createdAt: doc.createdAt?.toDate() || new Date(),
          updatedAt: doc.updatedAt?.toDate() || new Date(),
        }));
        setFeaturedProducts(transformedProducts);
      } catch (error) {
        console.error('Error fetching featured products:', error);
        if (error.code === 'permission-denied') {
          console.error('Firestore permission denied - check security rules');
        }
        setFeaturedProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const handleProductClick = (product: Product) => {
    window.location.href = `/product/${product.id}`;
  };

const ReceiptINR = ({ className = 'h-7 w-7 text-[#d25c4d]' }) => (
  <span className="relative inline-flex items-center justify-center">
    <ReceiptText className={className} aria-hidden="true" />
    <IndianRupee
      className="absolute h-3.5 w-3.5 text-[#d25c4d]"
      style={{ inset: 0, margin: 'auto' }} // centers ₹ inside the receipt
      aria-hidden="true"
    />
  </span>
);

  const reasons = [
  { label: 'Fit that Fits',        Icon: Ruler,   sub: 'In-between sizes that actually fit.' },
  { label: 'Comfort Fabrics',      Icon: Feather, sub: 'Breathable, soft, all-day wear.' },
  { label: 'Move-Friendly Cuts',   Icon: Move,    sub: 'Side-slit & easy silhouettes.' },
  { label: 'Transparent Pricing',  Icon: ReceiptINR, sub: 'Quality without hidden markups.' },
];


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      {/* <section className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Rewriting the Style guide
            </h1>
            <p className="mt-6 text-xl leading-8 text-blue-100">
              Find the perfect clothing pieces that express your unique personality
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link to="/products">
                <Button size="lg" variant="secondary">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/categories">
                <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 focus:ring-white/50">
                  Browse Categories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section> */}
      <section className="relative">
        <div
          className="
            h-[38vh] sm:h-[46vh] md:h-[60vh] lg:h-[72vh]
            bg-cover bg-top
          "
          style={{
            backgroundImage:
              "url('https://firebasestorage.googleapis.com/v0/b/oddfit-2cce7.firebasestorage.app/o/assets%2Fbanner%2Fbanner_desktop.png?alt=media&token=f2c97979-98fa-469c-bbe3-f56721b9f6b0')",
          }}
          aria-label="OddFit hero"
          role="img"
        />
      </section>      {/* Categories Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Shop by Collection</h2>
            {/* <p className="mt-4 text-lg text-gray-600">
              Explore our curated collections for every style and occasion
            </p> */}
          </div>
          
          {categoriesLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className={`grid gap-4 ${
              categories.length >= 4
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' // 4+ items → 4 cols on lg
                : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2' // <4 items → big blocks
            }`}
            >
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="group relative overflow-hidden rounded-lg bg-gray-200 aspect-square hover:shadow-lg transition-shadow duration-200 "
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <h3 className="text-white text-lg font-semibold text-center">
                      {category.name}
                    </h3>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-6 w-6 text-white" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 mb-6 md:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              Featured Collections
            </h2>

            <Link to="/products?featured=true" className="shrink-0">
              <Button
                variant="outline"
                className="inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-sm sm:px-4 sm:py-2 sm:text-base"
              >
                View All
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {productsLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onProductClick={handleProductClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No featured products available at the moment.</p>
            </div>
          )}
        </div>
      </section>
      {/* Stats Section */}
      {/* <section className="py-16 bg-gray-900 text-white">
        <div className="text-center text-3xl font-bold text-[#d25c4d] -mt-10 mb-4"> Reasons to Love us </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold">10K+</div>
              <div className="text-sm text-gray-400 mt-2">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">5K+</div>
              <div className="text-sm text-gray-400 mt-2">Products</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">99%</div>
              <div className="text-sm text-gray-400 mt-2">Satisfaction Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">24/7</div>
              <div className="text-sm text-gray-400 mt-2">Customer Support</div>
            </div>
          </div>
        </div>
      </section> */}
      <section className="py-12 sm:py-16 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h3 className="text-center text-2xl text-[#d25c4d] sm:text-3xl font-semibold text-white-900">
            Reasons to Love Us
          </h3>

          <div className="mt-8 grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
            {reasons.map(({ label, Icon, sub }) => (
              <div key={label} className="flex flex-col items-center text-center">
                <div className="h-14 w-14 rounded-full ring-1 ring-gray-200 flex items-center justify-center mb-3 bg-white">
                  <Icon className="h-7 w-7 text-[#d25c4d]" aria-hidden="true" />
                </div>
                <div className="text-sm sm:text-base text-purple-100 font-medium text-gray-900">{label}</div>
                <p className="mt-1 text-xs text-gray-500 max-w-[14rem]">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Newsletter Section */}
      <section className="py-16 bg-grey-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-purple-600 mb-6" />
          {/* <TrendingUp className="mx-auto h-12 w-12 text-purple-200 mb-6" /> */}
          <h2 className="text-3xl font-bold text-[#d25c4d] mb-4">
            Stay Updated with Latest Trends
          </h2>
          <p className="text-xl text-[#d25c4d] mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new arrivals, sales, and exclusive offers.
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="min-w-0 basis-[65%] sm:basis-auto sm:flex-1 rounded-lg border-0 text-gray-900 focus:ring-2 focus:ring-purple-300"
            />
            {/* <Button variant="primary" size="lg">
              Subscribe
            </Button> */}
            <Button
              size="lg"
              variant="brand"
            >
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

// gs://oddfit-2cce7.firebasestorage.app/assets/banner/banner_desktop.png