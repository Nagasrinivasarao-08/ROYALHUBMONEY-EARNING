
import React from 'react';
import { ShieldCheck, Target, Award, Globe, History } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-[#2c1810] rounded-xl p-8 text-white shadow-xl relative overflow-hidden border-b-4 border-amber-600">
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-amber-500 rounded-lg mx-auto flex items-center justify-center text-[#2c1810] font-bold text-3xl mb-4 shadow-lg">
            R
          </div>
          <h1 className="text-3xl font-bold mb-2">Royal Hub</h1>
          <p className="text-amber-100 text-sm tracking-wide uppercase font-medium">Premium Investment Solutions</p>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/30"></div>
      </div>

      {/* Mission Statement */}
      <div className="bg-white rounded-lg shadow-sm border border-amber-100 p-6">
        <div className="flex items-center mb-4 text-[#2c1810]">
          <Target size={24} className="text-amber-600 mr-3" />
          <h2 className="text-xl font-bold">Our Mission</h2>
        </div>
        <p className="text-gray-600 leading-relaxed text-sm">
          At Royal Hub, we aim to democratize wealth creation by providing accessible, high-yield investment opportunities in premium digital and physical assets. We bridge the gap between traditional finance and modern technology, ensuring transparency and growth for every partner.
        </p>
      </div>

      {/* History & Trust */}
      <div className="bg-white rounded-lg shadow-sm border border-amber-100 p-6">
        <div className="flex items-center mb-4 text-[#2c1810]">
          <History size={24} className="text-amber-600 mr-3" />
          <h2 className="text-xl font-bold">Our Legacy</h2>
        </div>
        <div className="space-y-4">
          <p className="text-gray-600 leading-relaxed text-sm">
            Founded in 2024, Royal Hub emerged as a pioneer in the micro-investment sector. What started as a small community of 50 investors has grown into a robust platform serving thousands of users across the region.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-amber-50 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-700">10k+</p>
              <p className="text-xs text-amber-900 uppercase font-bold">Active Users</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-amber-700">₹5Cr+</p>
              <p className="text-xs text-amber-900 uppercase font-bold">Assets Managed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Core Values */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-amber-500 flex items-start">
          <ShieldCheck size={24} className="text-amber-600 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">Security First</h3>
            <p className="text-xs text-gray-500">We utilize state-of-the-art encryption and strictly regulated banking partners to ensure your capital is always safe.</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-amber-500 flex items-start">
          <Award size={24} className="text-amber-600 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">Excellence</h3>
            <p className="text-xs text-gray-500">We rigorously vet every product listed on our platform to guarantee the highest possible returns for our investors.</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-amber-500 flex items-start">
          <Globe size={24} className="text-amber-600 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">Community</h3>
            <p className="text-xs text-gray-500">We believe in growing together. Our referral programs are designed to reward community building and shared success.</p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center py-6 text-gray-400 text-xs">
        <p>© 2024 Royal Hub Investment Corp.</p>
        <p>Licensed & Regulated • ISO 27001 Certified</p>
      </div>
    </div>
  );
};
