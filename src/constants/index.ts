// App-wide constants
export const APP_NAME = 'OddFit';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Product categories
// export const CATEGORIES = [
//   { id: 'men', name: 'Men', image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg' },
//   { id: 'women', name: 'Women', image: 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg' },
//   { id: 'kids', name: 'Kids', image: 'https://images.pexels.com/photos/1620653/pexels-photo-1620653.jpeg' },
//   { id: 'accessories', name: 'Accessories', image: 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg' },
//   { id: 'shoes', name: 'Shoes', image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg' },
// ];

// Product sizes
export const SIZES = ['S+', 'M+', 'L+', 'XL+']; //'XS+', , 'XXL'

// Product colors
// export const COLORS_OPTIONS = [
//   { name: 'Black', value: '#000000' },
//   { name: 'White', value: '#ffffff' },
//   { name: 'Gray', value: '#6b7280' },
//   { name: 'Red', value: '#dc2626' },
//   { name: 'Blue', value: '#2563eb' },
//   { name: 'Green', value: '#059669' },
//   { name: 'Yellow', value: '#d97706' },
//   { name: 'Purple', value: '#7c3aed' },
// ];

// Order status options
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
};

// Price ranges for filtering
// export const PRICE_RANGES = [
//   { label: 'Under ₹2,000', min: 0, max: 2000 },
//   { label: '₹2,000 - ₹5,000', min: 2000, max: 5000 },
//   { label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
//   { label: '₹10,000 - ₹20,000', min: 10000, max: 20000 },
//   { label: 'Over ₹20,000', min: 20000, max: Infinity },
// ];