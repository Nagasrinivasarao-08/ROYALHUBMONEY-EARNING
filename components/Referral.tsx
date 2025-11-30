import React from 'react';
import { User, AppSettings, Product } from '../types';
import { Copy, Users, DollarSign, Gift, UserPlus, Link, ShoppingBag } from 'lucide-react';

interface ReferralProps {
  user: User;
  allUsers: User[];
  products: Product[];
  settings: AppSettings;
}

export const Referral: React.FC<ReferralProps> = ({ user, allUsers, products, settings }) => {
  const referrals = allUsers.filter(u => u.referredBy === user.referralCode);
  
  // Calculate total earnings from 'referral' type transactions
  const totalReferralEarnings = user.transactions
    .filter(t => t.type === 'referral')
    .reduce((sum, t) => sum + t.amount, 0);

  const referralLink = `https://royal-invest.com?ref=${user.referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(user.referralCode);
    alert('Referral code copied!');
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    alert('Referral link copied!');
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-[#2c1810] rounded-xl p-6 text-white shadow-xl border-b-4 border-amber-600 relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Invite Friends</h2>
            <p className="text-amber-100 text-sm mb-6 max-w-[90%] leading-relaxed">
                Earn <span className="font-bold text-amber-400">{settings.referralBonusPercentage ?? 10}% Commission</span> immediately when your friend makes their first investment product purchase.
            </p>
            
            {/* Code Section */}
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-amber-500/30 flex items-center justify-between mb-4">
                <div>
                    <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">Your Referral Code</p>
                    <p className="text-3xl font-mono font-bold tracking-widest">{user.referralCode}</p>
                </div>
                <button 
                    onClick={copyToClipboard}
                    className="bg-amber-500 hover:bg-amber-400 text-[#2c1810] p-3 rounded-lg transition-colors shadow-lg"
                >
                    <Copy size={20} />
                </button>
            </div>

            {/* Link Section */}
            <div className="bg-black/20 rounded-lg p-1 border border-amber-500/10 flex items-center">
                 <div className="bg-amber-500/10 p-2 rounded-md mr-2">
                    <Link size={16} className="text-amber-400" />
                 </div>
                 <div className="flex-1 min-w-0">
                     <p className="text-[10px] text-amber-400 uppercase font-bold mb-0.5">Share Link</p>
                     <p className="text-xs font-mono text-gray-300 truncate">{referralLink}</p>
                 </div>
                 <button
                    onClick={copyLinkToClipboard}
                     className="ml-2 bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-md text-xs font-bold transition-colors whitespace-nowrap"
                 >
                     Copy Link
                 </button>
            </div>
        </div>
        <Gift className="absolute -bottom-4 -right-4 text-amber-500/10 rotate-12" size={140} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-amber-100 flex flex-col justify-between h-24">
            <div className="flex items-center text-amber-600 mb-2">
                <Users size={18} className="mr-2" />
                <span className="font-bold text-xs uppercase tracking-wide">Team Size</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{referrals.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-amber-100 flex flex-col justify-between h-24">
            <div className="flex items-center text-green-600 mb-2">
                <DollarSign size={18} className="mr-2" />
                <span className="font-bold text-xs uppercase tracking-wide">Total Earned</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">₹{totalReferralEarnings.toLocaleString()}</p>
        </div>
      </div>

      {/* Referral List */}
      <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
        <div className="bg-amber-50 p-3 border-b border-amber-100 flex justify-between items-center">
            <h3 className="font-bold text-[#2c1810] text-sm flex items-center">
                <Users size={16} className="mr-2" /> My Team Members
            </h3>
            <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {referrals.length} Users
            </span>
        </div>
        {referrals.length === 0 ? (
             <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400 text-sm">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-300">
                    <UserPlus size={24} />
                </div>
                No referrals yet. Share your code to start earning!
            </div>
        ) : (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {referrals.map(ref => (
                    <div key={ref.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-800 font-bold text-sm">
                                    {ref.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{ref.username}</p>
                                    <p className="text-[10px] text-gray-400">Joined: {new Date(ref.registeredAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                 <p className="text-[10px] text-gray-500 uppercase font-bold">Investments</p>
                                 <div className="flex items-center justify-end space-x-1">
                                    <span className={`font-bold ${ref.investments.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                        {ref.investments.length}
                                    </span>
                                    {ref.investments.length > 0 && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                                 </div>
                            </div>
                        </div>

                        {/* Investment History Section */}
                        {ref.investments.length > 0 && (
                            <div className="mt-3 ml-12 bg-amber-50/50 rounded-lg p-3 border border-amber-100">
                                <h4 className="text-[10px] font-bold text-amber-800 uppercase mb-2 flex items-center">
                                    <ShoppingBag size={10} className="mr-1"/> Portfolio History
                                </h4>
                                <div className="space-y-2">
                                    {ref.investments.map(inv => {
                                        const product = products.find(p => p.id === inv.productId);
                                        return (
                                            <div key={inv.id} className="flex justify-between items-center text-xs border-b border-gray-100 last:border-0 pb-1 last:pb-0">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-800">{product?.name || 'Unknown Product'}</span>
                                                    <span className="text-[10px] text-gray-400">{new Date(inv.purchaseDate).toLocaleDateString()}</span>
                                                </div>
                                                <span className="font-bold text-amber-700">₹{product?.price || 0}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};