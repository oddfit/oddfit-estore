import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SortAsc, Grid, List, X } from 'lucide-react';
import { Product, FilterOptions } from '../types';
import { SIZES, COLORS_OPTIONS, PRICE_RANGES } from '../constants';
import SearchBar from '../components/ui/SearchBar';
import ProductCard from '../components/ui/ProductCard';
import Button from '../components/ui/Button';
import { useCategories } from '../hooks/useCategories';
import { productsService } from '../services/firestore';
import { toJsDate } from '../hooks/useCategories';

const ProductListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const { categories } = useCategories();
  
  const [filters, setFilters] = useState<FilterOptions>({
    category: searchParams.get('category') || undefined,
    priceMin: undefined,
    priceMax: undefined,
    sizes: [],
    colors: [],
    sortBy: 'newest',
  });

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('Fetching all products from Firestore...');
        
        const productsData = await productsService.getAll();
        console.log('Raw products data:', productsData);
        console.log('Number of products fetched:', productsData.length);
        
        // Transform Firestore data to match Product interface
        const transformedProducts = productsData.map((doc: any) => ({
          id: doc.id,
          name: doc.product_name,
          description: doc.description || '',
          price: doc.price || 0,
          images: doc.image_url ? [doc.image_url] : [],
          category: doc.category || '',
          sizes: doc.sizes || [],
          colors: doc.colors || [],
          stock: doc.stock || 0,
          rating: doc.rating || 0,
          reviewCount: doc.reviewCount || 0,
          featured: doc.featured || false,
          createdAt: toJsDate(doc.createdAt) || new Date(),
          updatedAt: toJsDate(doc.updatedAt) || new Date(),
        }));
        
        console.log('Transformed products:', transformedProducts);
        setProducts(transformedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...products];

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Price filter
    if (filters.priceMin !== undefined) {
      filtered = filtered.filter(product => product.price >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      filtered = filtered.filter(product => product.price <= filters.priceMax!);
    }

    // Size filter
    if (filters.sizes && filters.sizes.length > 0) {
      filtered = filtered.filter(product => 
        product.sizes.some(size => filters.sizes!.includes(size))
      );
    }

    // Color filter
    if (filters.colors && filters.colors.length > 0) {
      filtered = filtered.filter(product => 
        product.colors.some(color => filters.colors!.includes(color))
      );
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }

    setFilteredProducts(filtered);
  }, [products, filters]);

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleProductClick = (product: Product) => {
    window.location.href = `/product/${product.id}`;
  };


  const clearFilters = () => {
    setFilters({
      category: undefined,
      priceMin: undefined,
      priceMax: undefined,
      sizes: [],
      colors: [],
      sortBy: 'newest',
    });
    setSearchParams({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {filters.category 
                ? categories.find(c => c.id === filters.category)?.name || 'Products'
                : 'All Products'
              }
            </h1>
            <p className="text-gray-600 mt-2">
              {filteredProducts.length} products found
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="hidden md:flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Sort */}
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className={`
            w-80 space-y-6 flex-shrink-0
            ${showFilters ? 'block' : 'hidden md:block'}
          `}>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-purple-600 hover:text-purple-800"
                >
                  Clear All
                </button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Category</h4>
                <div className="space-y-2">
                  {categories.map(category => (
                    <label key={category.id} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={category.id}
                        checked={filters.category === category.id}
                        onChange={(e) => handleFilterChange({ 
                          category: e.target.checked ? category.id : undefined 
                        })}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-3 text-sm">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Price</h4>
                <div className="space-y-2">
                  {PRICE_RANGES.map((range, index) => (
                    <label key={index} className="flex items-center">
                      <input
                        type="radio"
                        name="price"
                        checked={filters.priceMin === range.min && filters.priceMax === range.max}
                        onChange={() => handleFilterChange({
                          priceMin: range.min,
                          priceMax: range.max === Infinity ? undefined : range.max
                        })}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-3 text-sm">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Size</h4>
                <div className="grid grid-cols-3 gap-2">
                  {SIZES.map(size => (
                    <label key={size} className="flex items-center">
                      <input
                        type="checkbox"
                        value={size}
                        checked={filters.sizes?.includes(size) || false}
                        onChange={(e) => {
                          const newSizes = e.target.checked
                            ? [...(filters.sizes || []), size]
                            : (filters.sizes || []).filter(s => s !== size);
                          handleFilterChange({ sizes: newSizes });
                        }}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm">{size}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Color</h4>
                <div className="grid grid-cols-4 gap-3">
                  {COLORS_OPTIONS.map(color => (
                    <label key={color.name} className="flex flex-col items-center cursor-pointer">
                      <div
                        className={`w-8 h-8 rounded-full border-2 ${
                          filters.colors?.includes(color.name)
                            ? 'border-purple-600'
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                      />
                      <input
                        type="checkbox"
                        value={color.name}
                        checked={filters.colors?.includes(color.name) || false}
                        onChange={(e) => {
                          const newColors = e.target.checked
                            ? [...(filters.colors || []), color.name]
                            : (filters.colors || []).filter(c => c !== color.name);
                          handleFilterChange({ colors: newColors });
                        }}
                        className="hidden"
                      />
                      <span className="text-xs mt-1">{color.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found matching your filters.</p>
                <Button onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className={`
                grid gap-6
                ${viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
                }
              `}>
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onProductClick={handleProductClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;