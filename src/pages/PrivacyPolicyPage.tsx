import React from 'react';
import { Shield, Eye, Lock, Users } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-gray-500 mt-4">Last updated: January 2025</p>
        </div>

        {/* Key Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <Eye className="h-8 w-8 text-[#d25c4d] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Transparency</h3>
            <p className="text-gray-600">We're clear about what data we collect and why</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <Lock className="h-8 w-8 text-[#d25c4d] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Security</h3>
            <p className="text-gray-600">Your data is encrypted and securely stored</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <Users className="h-8 w-8 text-[#d25c4d] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Control</h3>
            <p className="text-gray-600">You control your data and can request deletion</p>
          </div>
        </div>

        {/* Policy Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
                <p>When you create an account or make a purchase, we collect:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Name and phone number</li>
                  <li>Shipping and billing addresses</li>
                  <li>Payment information (processed securely by our payment partners)</li>
                  <li>Order history and preferences</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Automatic Information</h3>
                <p>We automatically collect certain information when you visit our website:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Device information and browser type</li>
                  <li>IP address and location data</li>
                  <li>Pages visited and time spent on site</li>
                  <li>Referral sources</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
            <div className="space-y-4 text-gray-600">
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Process and fulfill your orders</li>
                <li>Communicate about your orders and account</li>
                <li>Provide customer support</li>
                <li>Improve our products and services</li>
                <li>Send promotional emails (with your consent)</li>
                <li>Prevent fraud and ensure security</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information Sharing</h2>
            <div className="space-y-4 text-gray-600">
              <p>We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Service Providers:</strong> Shipping companies, payment processors, and other trusted partners who help us operate our business</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
              </ul>
              <p className="mt-4">All third parties are required to protect your information and use it only for the specified purposes.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
            <div className="space-y-4 text-gray-600">
              <p>We implement industry-standard security measures to protect your information:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>SSL encryption for all data transmission</li>
                <li>Secure servers with regular security updates</li>
                <li>Limited access to personal information</li>
                <li>Regular security audits and monitoring</li>
                <li>PCI DSS compliance for payment processing</li>
              </ul>
              <p className="mt-4">While we strive to protect your information, no method of transmission over the internet is 100% secure.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
            <div className="space-y-4 text-gray-600">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correct:</strong> Update or correct inaccurate information</li>
                <li><strong>Delete:</strong> Request deletion of your personal information</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Portability:</strong> Request your data in a portable format</li>
              </ul>
              <p className="mt-4">To exercise these rights, contact us at <a href="mailto:privacy@oddfit.in" className="text-[#d25c4d] hover:underline">privacy@oddfit.in</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking</h2>
            <div className="space-y-4 text-gray-600">
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Remember your preferences and login status</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Provide personalized content and recommendations</li>
                <li>Enable social media features</li>
              </ul>
              <p className="mt-4">You can control cookies through your browser settings, but some features may not work properly if cookies are disabled.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
            <div className="space-y-4 text-gray-600">
              <p>Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will delete it immediately.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
            <div className="space-y-4 text-gray-600">
              <p>We may update this privacy policy from time to time. We will notify you of any material changes by:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Posting the updated policy on our website</li>
                <li>Sending an email notification to registered users</li>
                <li>Displaying a notice on our website</li>
              </ul>
              <p className="mt-4">Your continued use of our services after any changes indicates your acceptance of the updated policy.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <div className="space-y-4 text-gray-600">
              <p>If you have any questions about this privacy policy or our data practices, please contact us:</p>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p><strong>Email:</strong> <a href="mailto:privacy@oddfit.in" className="text-[#d25c4d] hover:underline">privacy@oddfit.in</a></p>
                <p><strong>Address:</strong> OddFit, Bengaluru, Karnataka, India</p>
                <p><strong>Phone:</strong> Available through our contact form</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;