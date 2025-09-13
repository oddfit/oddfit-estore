import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
// import SearchBar from '../ui/SearchBar';
import SearchBar from '../search/SearchBar';

interface HeaderProps {
  cartItemCount?: number;
  onMobileMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItemCount = 0, onMobileMenuToggle }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  // Only count as logged-in if NOT anonymous
  const isLoggedIn = !!currentUser && !currentUser.isAnonymous;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button (mobile only) */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={onMobileMenuToggle}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <div className="flex items-center shrink-0">
            <Link to="/" className="flex items-center lg:flex-col lg:items-center">
              <img src="/logo_desktop.png" alt="OddFit" className="h-8 w-auto object-contain lg:h-12" />
              <span className="hidden lg:block text-sm text-[#d25c4d] -mt-3">Rewriting the size guide</span>
            </Link>
          </div>

          {/* Desktop/Tablet nav ONLY (hidden on mobile) */}
          {/* <nav className="hidden md:flex flex-1 min-w-0 items-center justify-center gap-4 lg:gap-8 font-semibold text-[#d25c4d]">
            <Link to="/categories" className="hover:text-purple-900 whitespace-nowrap text-sm lg:text-base">About Us</Link>
            <Link to="/products" className="hover:text-purple-900 whitespace-nowrap text-sm lg:text-base">Shop Now</Link>
            <Link to="/categories" className="hover:text-purple-900 whitespace-nowrap text-sm lg:text-base">Browse Categories</Link>
            <Link to="/size_guide" className="hover:text-purple-900 whitespace-nowrap text-sm lg:text-base">Size Guide</Link>
            <Link to="/contact" className="hover:text-purple-900 whitespace-nowrap text-sm lg:text-base">Contact Us</Link>
          </nav> */}

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-4 hidden md:block">
            <SearchBar />
          </div>

          {/* Right-side icons / actions */}
          <div className="flex items-center space-x-2">
            {/* Mobile Search (mobile only) */}
            {/* <button className="md:hidden p-2 text-[#d25c4d] hover:text-gray-900" aria-label="Search">
              <Search className="h-5 w-5" />
            </button> */}

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="p-2 text-[#d25c4d] hover:text-purple-900 transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-[#d25c4d] hover:text-purple-900 transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* User Account */}
            {(() => {
              const profileHref = isLoggedIn ? '/profile' : '/login?redirect=/profile';
              return (
                <Link
                  to={profileHref}
                  className="p-2 text-[#d25c4d] hover:text-purple-900 transition-colors"
                  aria-label="Profile"
                >
                  <User className="h-5 w-5" />
                </Link>
              );
            })()}


            {/* Auth buttons (shown ≥ sm) */}
            {isLoggedIn ? (
              <div className="hidden lg:flex items-center space-x-2 ml-4">
                <span className="text-sm text-purple-600">
                  Hi, {currentUser?.displayName || 'User'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-[#d25c4d] hover:text-purple-900"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center space-x-2 ml-4">
                <Link to="/login">
                  <Button size="sm" variant="brand">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" variant="brand">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="md:hidden pb-3">
          <SearchBar />
        </div>
      </div>
    </header>
  );
};

export default Header;
