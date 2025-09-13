import React from 'react';
import { Truck, Clock, MapPin, Package, Shield, CreditCard } from 'lucide-react';

const ShippingInfoPage: React.FC = () => {
  const shippingOptions = [
    {
      title: 'Standard Shipping',
      price: '₹99',
      duration: '5-7 business days',
      description: 'Reliable delivery across India',
      icon: Truck,
    },
    {
      title: 'Express Shipping',
      price: '₹199',
      duration: '2-3 business days',
      description: 'Faster delivery for urgent orders',
      icon: Clock,
    },
    {
      title: 'Free Shipping',
      price: 'Free',
      duration: '5-7 business days',
      description: 'On orders above ₹999',
      icon: Package,
    },
  ];

  const deliveryZones = [
    {
      zone: 'Metro Cities',
      cities: 'Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad, Pune',
      duration: '2-4 business days',
    },
    {
      zone: 'Tier 1 Cities',
      cities: 'Ahmedabad, Surat, Jaipur, Lucknow, Kanpur, Nagpur, Indore',
      duration: '3-5 business days',
    },
    {
      zone: 'Tier 2 Cities',
      cities: 'Agra, Nashik, Faridabad, Meerut, Rajkot, Varanasi, Srinagar',
      duration: '4-6 business days',
    },
    {
      zone: 'Other Areas',
      cities: 'All other serviceable locations across India',
      duration: '5-7 business days',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping Information</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We deliver across India with reliable shipping partners to ensure your orders reach you safely and on time.
          </p>
        </div>

        {/* Shipping Options */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Shipping Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {shippingOptions.map((option, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <option.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{option.title}</h3>
                <div className="text-3xl font-bold text-[#d25c4d] mb-2">{option.price}</div>
                <div className="text-lg text-gray-600 mb-4">{option.duration}</div>
                <p className="text-gray-600">{option.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Zones */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Delivery Timeline by Location</h2>
          <div className="space-y-6">
            {deliveryZones.map((zone, index) => (
              <div key={index} className="border-l-4 border-[#d25c4d] pl-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-2 md:mb-0">
                    <h3 className="text-lg font-semibold text-gray-900">{zone.zone}</h3>
                    <p className="text-gray-600">{zone.cities}</p>
                  </div>
                  <div className="text-[#d25c4d] font-semibold">{zone.duration}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Process */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Order Placed</h3>
              <p className="text-gray-600">Complete your purchase and receive order confirmation</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Processing</h3>
              <p className="text-gray-600">We carefully pack your items within 1-2 business days</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Shipped</h3>
              <p className="text-gray-600">Your order is dispatched with tracking information</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Delivered</h3>
              <p className="text-gray-600">Receive your package at your doorstep</p>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <Shield className="h-6 w-6 text-[#d25c4d] mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Secure Packaging</h3>
            </div>
            <ul className="space-y-3 text-gray-600">
              <li>• All items are carefully wrapped and protected</li>
              <li>• Eco-friendly packaging materials used</li>
              <li>• Tamper-evident sealing for security</li>
              <li>• Weather-resistant outer packaging</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <Clock className="h-6 w-6 text-[#d25c4d] mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Order Processing</h3>
            </div>
            <ul className="space-y-3 text-gray-600">
              <li>• Orders placed before 2 PM ship same day</li>
              <li>• Weekend orders processed on Monday</li>
              <li>• Holiday processing may take longer</li>
              <li>• You'll receive tracking info via email/SMS</li>
            </ul>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I change my shipping address?</h3>
              <p className="text-gray-600 mb-4">Yes, you can change your address within 2 hours of placing the order by contacting our support team.</p>
              
              <h3 className="font-semibold text-gray-900 mb-2">Do you ship internationally?</h3>
              <p className="text-gray-600 mb-4">Currently, we only ship within India. International shipping will be available soon.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What if my package is damaged?</h3>
              <p className="text-gray-600 mb-4">Please contact us immediately with photos. We'll arrange a replacement or refund.</p>
              
              <h3 className="font-semibold text-gray-900 mb-2">Can I track my order?</h3>
              <p className="text-gray-600 mb-4">Yes, you'll receive tracking information via email and SMS once your order ships.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingInfoPage;