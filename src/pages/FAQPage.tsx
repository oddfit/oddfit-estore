import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Search } from 'lucide-react';

const FAQPage: React.FC = () => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const faqCategories = [
    {
      category: 'Orders & Shipping',
      faqs: [
        {
          question: 'How long does shipping take?',
          answer: 'Standard shipping takes 5-7 business days, while express shipping takes 2-3 business days. Metro cities typically receive orders faster. Free shipping is available on orders above ₹999.',
        },
        {
          question: 'Can I track my order?',
          answer: 'Yes! Once your order ships, you\'ll receive tracking information via email and SMS. You can also track your order in the "My Orders" section of your account.',
        },
        {
          question: 'Can I change my shipping address after placing an order?',
          answer: 'You can change your shipping address within 2 hours of placing the order by contacting our customer support team. After that, changes may not be possible as the order enters processing.',
        },
        {
          question: 'Do you ship internationally?',
          answer: 'Currently, we only ship within India. We\'re working on expanding to international shipping soon. Stay tuned for updates!',
        },
      ],
    },
    {
      category: 'Sizing & Fit',
      faqs: [
        {
          question: 'What does the "+" in your sizes mean?',
          answer: 'Our "+" sizing system (S+, M+, L+, XL+) is designed for people who fall between traditional sizes. These sizes offer a more comfortable and flattering fit with slightly more room than standard sizing.',
        },
        {
          question: 'How do I find my perfect size?',
          answer: 'Check our detailed size guide with measurements for each category. Measure yourself and compare with our size charts. If you\'re between sizes, we recommend going with the larger size for comfort.',
        },
        {
          question: 'What if the size doesn\'t fit?',
          answer: 'No worries! We offer free size exchanges within 30 days. The item must be in original condition with tags attached. Contact us to initiate a size exchange.',
        },
        {
          question: 'Are your clothes true to size?',
          answer: 'Our clothes are designed to be comfortable and flattering. The "+" sizing runs slightly larger than traditional sizing to ensure a better fit for in-between sizes.',
        },
      ],
    },
    {
      category: 'Returns & Exchanges',
      faqs: [
        {
          question: 'What is your return policy?',
          answer: 'We offer a 30-day return policy from the delivery date. Items must be in original condition with tags attached, unworn and unwashed. Returns are free of charge.',
        },
        {
          question: 'How do I return an item?',
          answer: 'Contact our customer service team within 30 days of delivery. We\'ll provide you with return instructions and a prepaid return label. Pack the item securely and ship it back to us.',
        },
        {
          question: 'How long does it take to get my refund?',
          answer: 'Once we receive your return, we\'ll process the refund within 5-7 business days. The refund will be credited to your original payment method. Bank processing may take an additional 3-5 days.',
        },
        {
          question: 'Can I exchange for a different product?',
          answer: 'Yes! You can exchange for any item of equal or lesser value. If there\'s a price difference, we\'ll refund the difference. Each order is eligible for one exchange.',
        },
      ],
    },
    {
      category: 'Payment & Account',
      faqs: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit/debit cards, UPI payments, net banking, and cash on delivery (COD). All payments are processed securely through encrypted channels.',
        },
        {
          question: 'Is it safe to shop on your website?',
          answer: 'Absolutely! We use industry-standard SSL encryption to protect your personal and payment information. Your data is secure and never shared with third parties.',
        },
        {
          question: 'Do I need to create an account to shop?',
          answer: 'You can browse and add items to cart as a guest, but you\'ll need to verify your phone number during checkout. Creating an account helps you track orders and manage your preferences.',
        },
        {
          question: 'How do I reset my password?',
          answer: 'We use phone number verification for login, so there\'s no password to reset. Simply enter your phone number and we\'ll send you an OTP to log in securely.',
        },
      ],
    },
    {
      category: 'Products & Care',
      faqs: [
        {
          question: 'What materials are your clothes made from?',
          answer: 'We use high-quality, breathable fabrics like cotton, linen blends, and soft modal. Each product page lists the specific fabric composition and care instructions.',
        },
        {
          question: 'How should I care for my OddFit clothes?',
          answer: 'Most of our items are machine washable in cold water. Check the care label on each garment for specific instructions. We recommend air drying to maintain fabric quality and color.',
        },
        {
          question: 'Do your clothes shrink after washing?',
          answer: 'Our clothes are pre-shrunk during manufacturing to minimize shrinkage. Following the care instructions will help maintain the fit and quality of your garments.',
        },
        {
          question: 'Are your products ethically made?',
          answer: 'Yes! We work with certified manufacturers who follow ethical labor practices. We\'re committed to sustainable fashion and fair working conditions throughout our supply chain.',
        },
      ],
    },
  ];

  const allFAQs = faqCategories.flatMap((category, categoryIndex) =>
    category.faqs.map((faq, faqIndex) => ({
      ...faq,
      id: categoryIndex * 100 + faqIndex,
      category: category.category,
    }))
  );

  const filteredFAQs = searchTerm
    ? allFAQs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allFAQs;

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about OddFit. Can't find what you're looking for? 
            Contact our support team for personalized help.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-12">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-lg"
          />
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          {searchTerm ? (
            // Show filtered results when searching
            <>
              <div className="text-sm text-gray-600 mb-6">
                {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''} found
              </div>
              {filteredFAQs.map((faq) => (
                <div key={faq.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="text-sm text-[#d25c4d] font-medium mb-1">{faq.category}</div>
                      <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                    </div>
                    {expandedFAQ === faq.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFAQ === faq.id && (
                    <div className="px-8 pb-8">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            // Show categorized FAQs when not searching
            faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{category.category}</h2>
                <div className="space-y-4">
                  {category.faqs.map((faq, faqIndex) => {
                    const faqId = categoryIndex * 100 + faqIndex;
                    return (
                      <div key={faqId} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <button
                          onClick={() => toggleFAQ(faqId)}
                          className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                          {expandedFAQ === faqId ? (
                            <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        {expandedFAQ === faqId && (
                          <div className="px-8 pb-8">
                            <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Still Need Help */}
        <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Can't find the answer you're looking for? Our customer support team is here to help 
            with any questions or concerns you may have.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Contact Support
            </a>
            <a
              href="mailto:support@oddfit.in"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;