import React from 'react';
import { Heart, Users, Award, Truck } from 'lucide-react';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';

const AboutPage: React.FC = () => {
  const values = [
    {
      icon: Heart,
      title: 'Passion for Fashion',
      description: 'We believe fashion should be accessible, comfortable, and expressive of your unique personality.',
    },
    {
      icon: Users,
      title: 'Customer First',
      description: 'Every decision we make is centered around providing the best experience for our customers.',
    },
    {
      icon: Award,
      title: 'Quality Promise',
      description: 'We source premium materials and maintain strict quality standards in every piece we create.',
    },
    {
      icon: Truck,
      title: 'Reliable Service',
      description: 'From order to delivery, we ensure a smooth and transparent shopping experience.',
    },
  ];

  const team = [
    {
      name: 'Priya Sharma',
      role: 'Founder & CEO',
      description: 'Fashion enthusiast with 10+ years in the industry, passionate about creating inclusive sizing.',
    },
    {
      name: 'Rahul Gupta',
      role: 'Head of Design',
      description: 'Award-winning designer focused on comfort-first fashion that doesn\'t compromise on style.',
    },
    {
      name: 'Anita Patel',
      role: 'Customer Experience',
      description: 'Dedicated to ensuring every customer feels valued and supported throughout their journey.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Rewriting the Size Guide
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              OddFit was born from a simple belief: everyone deserves clothing that fits perfectly, 
              feels comfortable, and makes them confident.
            </p>
            <Link to="/products">
              <Button size="lg" variant="secondary">
                Shop Our Collection
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600 text-lg">
                <p>
                  Founded in 2023, OddFit emerged from the frustration of finding clothes that truly fit. 
                  We noticed that traditional sizing often left people in between sizes, compromising on 
                  comfort or style.
                </p>
                <p>
                  Our mission is simple: create beautiful, comfortable clothing with sizing that actually 
                  makes sense. We introduced the "+" sizing system - S+, M+, L+, XL+ - designed for 
                  those who fall between traditional sizes.
                </p>
                <p>
                  Today, we're proud to serve thousands of customers across India, helping them discover 
                  the joy of clothes that fit just right.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg"
                alt="OddFit team working"
                className="rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              These principles guide everything we do, from design to customer service.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Team */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The passionate people behind OddFit, working to revolutionize how you shop for clothes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-[#d25c4d] font-medium mb-4">{member.role}</p>
                <p className="text-gray-600">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Perfect Fit?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who've discovered the OddFit difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button size="lg" variant="secondary">
                Shop Now
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;