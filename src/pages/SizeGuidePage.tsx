import React, { useState } from 'react';
import { Ruler, Info, ChevronDown, ChevronUp } from 'lucide-react';

const SizeGuidePage: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>('kurti');

  const sizeCharts = {
    kurti: {
      title: 'Kurti Size Guide',
      description: 'Our kurtis are designed with a relaxed fit for maximum comfort.',
      sizes: [
        { size: 'S+', bust: '34-36', waist: '28-30', length: '42-44' },
        { size: 'M+', bust: '36-38', waist: '30-32', length: '42-44' },
        { size: 'L+', bust: '38-40', waist: '32-34', length: '42-44' },
        { size: 'XL+', bust: '40-42', waist: '34-36', length: '42-44' },
      ],
    },
    shortKurti: {
      title: 'Short Top Size Guide',
      description: 'Perfect for casual wear and layering.',
      sizes: [
        { size: 'S+', bust: '34-36', waist: '28-30', length: '24-26' },
        { size: 'M+', bust: '36-38', waist: '30-32', length: '24-26' },
        { size: 'L+', bust: '38-40', waist: '32-34', length: '24-26' },
        { size: 'XL+', bust: '40-42', waist: '34-36', length: '24-26' },
      ],
    },
    coOrd: {
      title: 'Co-Ord Set Size Guide',
      description: 'Matching sets designed for a coordinated look.',
      sizes: [
        { size: 'S+', bust: '34-36', waist: '28-30', hip: '36-38' },
        { size: 'M+', bust: '36-38', waist: '30-32', hip: '38-40' },
        { size: 'L+', bust: '38-40', waist: '32-34', hip: '40-42' },
        { size: 'XL+', bust: '40-42', waist: '34-36', hip: '42-44' },
      ],
    },
  };

  const measurementTips = [
    {
      title: 'Bust Measurement',
      description: 'Measure around the fullest part of your bust, keeping the tape parallel to the floor.',
    },
    {
      title: 'Waist Measurement',
      description: 'Measure around your natural waistline, which is typically the narrowest part of your torso.',
    },
    {
      title: 'Hip Measurement',
      description: 'Measure around the fullest part of your hips, about 7-9 inches below your waist.',
    },
    {
      title: 'Length Measurement',
      description: 'For tops, measure from the highest point of your shoulder down to where you want the garment to end.',
    },
  ];

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Ruler className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Size Guide</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find your perfect fit with our comprehensive size guide. Our "+" sizing system is designed 
            for those who fall between traditional sizes.
          </p>
        </div>

        {/* What Makes Our Sizing Different */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-12">
          <div className="flex items-start">
            <Info className="h-6 w-6 text-[#d25c4d] mt-1 flex-shrink-0" />
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What Makes Our Sizing Different?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                <div>
                  <h3 className="font-semibold mb-2">The "+" System</h3>
                  <p>Our S+, M+, L+, XL+ sizes are specifically designed for bodies that fall between traditional sizing, offering a more comfortable and flattering fit.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Comfort First</h3>
                  <p>We prioritize comfort without compromising style. Our cuts allow for natural movement while maintaining a flattering silhouette.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Quality Fabrics</h3>
                  <p>We use breathable, soft fabrics that drape beautifully and feel comfortable against your skin all day long.</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Inclusive Design</h3>
                  <p>Every piece is designed to be inclusive and flattering for different body types, celebrating your unique shape.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Size Charts */}
        <div className="space-y-6 mb-12">
          {Object.entries(sizeCharts).map(([key, chart]) => (
            <div key={key} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <button
                onClick={() => toggleSection(key)}
                className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{chart.title}</h3>
                  <p className="text-gray-600 mt-1">{chart.description}</p>
                </div>
                {expandedSection === key ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>
              
              {expandedSection === key && (
                <div className="px-8 pb-8">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Size</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Bust (inches)</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Waist (inches)</th>
                          {chart.sizes[0].hip && (
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">Hip (inches)</th>
                          )}
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Length (inches)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chart.sizes.map((size, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-[#d25c4d]">{size.size}</td>
                            <td className="py-3 px-4 text-gray-700">{size.bust}</td>
                            <td className="py-3 px-4 text-gray-700">{size.waist}</td>
                            {size.hip && (
                              <td className="py-3 px-4 text-gray-700">{size.hip}</td>
                            )}
                            <td className="py-3 px-4 text-gray-700">{size.length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* How to Measure */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How to Take Your Measurements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {measurementTips.map((tip, index) => (
              <div key={index} className="flex items-start">
                <div className="w-8 h-8 bg-[#d25c4d] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                  {index + 1}
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
                  <p className="text-gray-600">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fit Tips */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still Unsure About Your Size?</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Our customer service team is here to help! We can provide personalized sizing recommendations 
            based on your measurements and preferences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Contact Us for Help
            </a>
            <a
              href="mailto:support@oddfit.in"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              Email: support@oddfit.in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeGuidePage;