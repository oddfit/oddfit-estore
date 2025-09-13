import React from 'react';
import { FileText, Scale, AlertTriangle, CheckCircle } from 'lucide-react';

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            These terms govern your use of OddFit's website and services. Please read them carefully.
          </p>
          <p className="text-sm text-gray-500 mt-4">Last updated: January 2025</p>
        </div>

        {/* Key Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <Scale className="h-8 w-8 text-[#d25c4d] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Fair Terms</h3>
            <p className="text-gray-600">Clear and reasonable terms for all users</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <CheckCircle className="h-8 w-8 text-[#d25c4d] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Rights</h3>
            <p className="text-gray-600">We respect your rights as a customer</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-[#d25c4d] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Responsibilities</h3>
            <p className="text-gray-600">Clear guidelines for using our services</p>
          </div>
        </div>

        {/* Terms Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptance of Terms</h2>
            <div className="space-y-4 text-gray-600">
              <p>By accessing and using the OddFit website and services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
              <p>These terms apply to all visitors, users, and customers of OddFit's website and services.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Use of Our Services</h2>
            <div className="space-y-4 text-gray-600">
              <h3 className="font-semibold text-gray-900">Permitted Use</h3>
              <p>You may use our services to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Browse and purchase products</li>
                <li>Create and manage your account</li>
                <li>Contact customer support</li>
                <li>Leave reviews and feedback</li>
              </ul>
              
              <h3 className="font-semibold text-gray-900 mt-6">Prohibited Use</h3>
              <p>You may not:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use our services for any illegal or unauthorized purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Transmit viruses or malicious code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt our services</li>
                <li>Use automated systems to access our website</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Registration</h2>
            <div className="space-y-4 text-gray-600">
              <p>To make purchases, you must create an account by providing accurate and complete information. You are responsible for:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Maintaining the confidentiality of your account</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Ensuring your information is accurate and up-to-date</li>
              </ul>
              <p className="mt-4">We reserve the right to suspend or terminate accounts that violate these terms.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Orders and Payments</h2>
            <div className="space-y-4 text-gray-600">
              <h3 className="font-semibold text-gray-900">Order Acceptance</h3>
              <p>All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason, including:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Product unavailability</li>
                <li>Pricing errors</li>
                <li>Suspected fraudulent activity</li>
                <li>Violation of these terms</li>
              </ul>
              
              <h3 className="font-semibold text-gray-900 mt-6">Pricing and Payment</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>All prices are in Indian Rupees (INR) and include applicable taxes</li>
                <li>Prices may change without notice</li>
                <li>Payment is required at the time of order</li>
                <li>We accept various payment methods as displayed at checkout</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Shipping and Delivery</h2>
            <div className="space-y-4 text-gray-600">
              <p>We ship to addresses within India. Shipping times and costs vary by location and are displayed at checkout.</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Delivery times are estimates and not guaranteed</li>
                <li>Risk of loss passes to you upon delivery</li>
                <li>You must provide accurate shipping information</li>
                <li>Additional charges may apply for remote locations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Returns and Refunds</h2>
            <div className="space-y-4 text-gray-600">
              <p>Our return policy is detailed on our Returns & Exchanges page. Key points:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>30-day return window from delivery date</li>
                <li>Items must be in original condition with tags</li>
                <li>Some items may not be returnable</li>
                <li>Refunds processed within 5-7 business days</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
            <div className="space-y-4 text-gray-600">
              <p>All content on our website, including text, graphics, logos, images, and software, is owned by OddFit or our licensors and is protected by copyright and other intellectual property laws.</p>
              <p>You may not:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Copy, modify, or distribute our content without permission</li>
                <li>Use our trademarks or logos without authorization</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Create derivative works based on our content</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
            <div className="space-y-4 text-gray-600">
              <p>To the maximum extent permitted by law, OddFit shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.</p>
              <p>Our total liability for any claim shall not exceed the amount you paid for the specific product or service that gave rise to the claim.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Indemnification</h2>
            <div className="space-y-4 text-gray-600">
              <p>You agree to indemnify and hold harmless OddFit from any claims, damages, or expenses arising from:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Your use of our services</li>
                <li>Your violation of these terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Any content you submit or transmit</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
            <div className="space-y-4 text-gray-600">
              <p>These terms are governed by the laws of India. Any disputes shall be resolved in the courts of Bengaluru, Karnataka, India.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
            <div className="space-y-4 text-gray-600">
              <p>We may update these terms from time to time. We will notify you of material changes by:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Posting the updated terms on our website</li>
                <li>Sending email notifications to registered users</li>
                <li>Displaying prominent notices on our website</li>
              </ul>
              <p className="mt-4">Your continued use of our services after changes indicates acceptance of the updated terms.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-4 text-gray-600">
              <p>If you have questions about these terms, please contact us:</p>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p><strong>Email:</strong> <a href="mailto:legal@oddfit.in" className="text-[#d25c4d] hover:underline">legal@oddfit.in</a></p>
                <p><strong>Address:</strong> OddFit, Bengaluru, Karnataka, India</p>
                <p><strong>Customer Support:</strong> <a href="/contact" className="text-[#d25c4d] hover:underline">Contact Form</a></p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;