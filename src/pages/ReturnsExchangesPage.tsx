import React from 'react';
import { RotateCcw, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import Button from '../components/ui/Button';

const ReturnsExchangesPage: React.FC = () => {
  const returnProcess = [
    {
      step: 1,
      title: 'Initiate Return',
      description: 'Contact us within 30 days of delivery',
      icon: Package,
    },
    {
      step: 2,
      title: 'Get Approval',
      description: 'We\'ll review and approve your return request',
      icon: CheckCircle,
    },
    {
      step: 3,
      title: 'Pack & Ship',
      description: 'Pack items in original condition and ship back',
      icon: RotateCcw,
    },
    {
      step: 4,
      title: 'Refund/Exchange',
      description: 'Receive refund or exchange within 5-7 days',
      icon: Clock,
    },
  ];

  const returnableItems = [
    'Items in original condition with tags attached',
    'Unworn and unwashed garments',
    'Items returned within 30 days of delivery',
    'Products in original packaging',
  ];

  const nonReturnableItems = [
    'Items without original tags',
    'Worn, washed, or damaged items',
    'Items returned after 30 days',
    'Sale or clearance items (unless defective)',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <RotateCcw className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Returns & Exchanges</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We want you to love your OddFit purchase. If something isn't quite right, 
            we're here to help with easy returns and exchanges.
          </p>
        </div>

        {/* Return Policy Overview */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Our Return Policy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#d25c4d] mb-2">30</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">Days</div>
              <p className="text-gray-600">Return window from delivery date</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#d25c4d] mb-2">Free</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">Returns</div>
              <p className="text-gray-600">No return shipping charges</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#d25c4d] mb-2">5-7</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">Days</div>
              <p className="text-gray-600">Refund processing time</p>
            </div>
          </div>
        </div>

        {/* Return Process */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How to Return</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {returnProcess.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-16 h-16 bg-white border-4 border-[#d25c4d] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-8 w-8 text-[#d25c4d]" />
                </div>
                <div className="w-8 h-8 bg-[#d25c4d] text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What Can/Cannot Be Returned */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">What Can Be Returned</h3>
            </div>
            <ul className="space-y-3">
              {returnableItems.map((item, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <XCircle className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">What Cannot Be Returned</h3>
            </div>
            <ul className="space-y-3">
              {nonReturnableItems.map((item, index) => (
                <li key={index} className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Exchange Information */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Exchanges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Size Exchanges</h3>
              <p className="text-gray-600 mb-4">
                If the size doesn't fit perfectly, we'll exchange it for a different size at no extra cost. 
                The item must be in original condition with tags attached.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li>• Same item, different size</li>
                <li>• No additional charges</li>
                <li>• Subject to availability</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Exchanges</h3>
              <p className="text-gray-600 mb-4">
                Want to exchange for a different product? You can exchange for any item of equal or lesser value. 
                Price differences will be refunded.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li>• Exchange for different product</li>
                <li>• Price difference refunded</li>
                <li>• One-time exchange per order</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Refund Information */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Refund Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Processing Time</h3>
              <p className="text-gray-600">5-7 business days after we receive your return</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Refund Method</h3>
              <p className="text-gray-600">Original payment method or bank transfer</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Bank Processing</h3>
              <p className="text-gray-600">Additional 3-5 days for bank processing</p>
            </div>
          </div>
        </div>

        {/* Contact for Returns */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Need to Return Something?</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Contact our customer service team to initiate your return or exchange. 
            We're here to make the process as smooth as possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact">
              <Button size="lg" variant="secondary">
                Contact Support
              </Button>
            </a>
            <a href="mailto:returns@oddfit.in">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                Email: returns@oddfit.in
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnsExchangesPage;