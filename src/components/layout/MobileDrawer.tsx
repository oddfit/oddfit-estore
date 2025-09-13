import React from 'react';
import { Link } from 'react-router-dom';
import { X, Home, Package, ShoppingCart, User, Heart, Settings } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { categories } = useCategories();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-0 left-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          {/* Main Links */}
          <div className="px-4 py-2">
            <div className="space-y-1">
              <Link
                to="/"
                className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                <Home className="h-5 w-5 mr-3" />
                Home
              </Link>
              <Link
                to="/products"
                className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                <Package className="h-5 w-5 mr-3" />
                All Products
              </Link>
              <Link
                to="/cart"
                className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                <ShoppingCart className="h-5 w-5 mr-3" />
                Shopping Cart
              </Link>
              <Link
                to="/wishlist"
                className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                <Heart className="h-5 w-5 mr-3" />
                Wishlist
              </Link>
              <Link
                to="/profile"
                className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                <User className="h-5 w-5 mr-3" />
                Profile
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div className="px-4 py-2 border-t">
            <h3 className="px-3 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Categories
            </h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={onClose}
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-6 w-6 rounded-md object-cover mr-3"
                  />
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Account Section */}
          <div className="px-4 py-2 border-t">
            <h3 className="px-3 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Account
            </h3>
            <div className="space-y-1">
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                Sign Up
              </Link>
              <Link
                to="/orders"
                className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                Order History
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default MobileDrawer;