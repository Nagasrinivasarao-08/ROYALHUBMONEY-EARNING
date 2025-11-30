import React, { useState } from 'react';
import { Product, User } from '../types';
import { analyzeProduct } from '../services/gemini';
import { Sparkles, Info, List, Table as TableIcon } from 'lucide-react';

interface InvestProps {
  products: Product[];
  user: User;
  onInvest: (product: Product) => void;
}

export const Invest: React.FC<InvestProps> = ({ products, user, onInvest }) => {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ id: string; text: string } | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const handleAnalyze = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setAnalyzingId(product.id);
    const text = await analyzeProduct(product);
    setAnalysisResult({ id: product.id, text });
    setAnalyzingId(null);
  };

  const calculateROI = (product: Product) => {
      return ((product.dailyIncome / product.price) * 100).toFixed(1);
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex bg-white rounded-lg p-1 shadow-sm border border-amber-100">
        <button 
            onClick={() => setViewMode('cards')}
            className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center ${viewMode === 'cards' ? 'bg-amber-50 text-white' : 'text-gray-500'}`}
        >
            <List size={16} className="mr-2" /> Products
        </button>
        <button 
            onClick={() => setViewMode('table')}
            className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center ${viewMode === 'table' ? 'bg-amber-50 text-white' : 'text-gray-500'}`}
        >
            <TableIcon size={16} className="mr-2" /> Profit Table
        </button>
      </div>

      <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start space-x-2">
        <Info className="text-amber-700 flex-shrink-0 mt-0.5" size={18} />
        <p className="text-xs text-amber-900 leading-relaxed">
            <strong>Royal Hub</strong> Product Profit Statement. 
            All Product Returns Can Be Collected Daily. 
            Principal is managed by Bank of India.
        </p>
      </div>

      {viewMode === 'cards' ? (
        <div className="space-y-6">
            {products.map((product) => (
            <div key={product.id} className="bg-white rounded-none shadow-sm overflow-hidden border border-gray-200">
                {/* Card Image and Overlay */}
                <div className="h-48 relative">
                    <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
                        <h3 className="text-xl font-bold text-white">{product.name}</h3>
                        <div className="w-full bg-gray-600/50 rounded-full h-1.5 mt-2">
                            <div className="bg-amber-500 h-1.5 rounded-full w-1/3"></div>
                        </div>
                    </div>
                </div>
                
                {/* Card Content - Matching Screenshot Style */}
                <div className="bg-[#2c1810] text-white p-5">
                    <div className="space-y-2 text-sm text-gray-300">
                        <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span>Lease Time</span>
                            <span className="text-white font-semibold">{product.days} Day</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span>Daily Income</span>
                            <span className="text-amber-400 font-semibold">₹{product.dailyIncome}</span>
                        </div>
                         <div className="flex justify-between border-b border-gray-700 pb-2">
                            <span>Total Profit</span>
                            <span className="text-amber-400 font-semibold">₹{product.totalRevenue}</span>
                        </div>
                        <div className="flex justify-between pt-2">
                             <span>Investment Amount</span>
                             <span className="text-white font-bold text-lg">₹{product.price}</span>
                        </div>
                    </div>

                    {/* AI Analysis Section */}
                    {analysisResult && analysisResult.id === product.id && (
                        <div className="mt-4 mb-2 bg-indigo-900/50 p-3 rounded border border-indigo-500/30 text-xs text-indigo-200 animate-fadeIn">
                            <div className="flex items-center mb-1 font-semibold text-indigo-400">
                                <Sparkles size={12} className="mr-1" /> AI Advisor
                            </div>
                            {analysisResult.text}
                        </div>
                    )}

                    <div className="mt-5 grid grid-cols-5 gap-2">
                        <button
                            onClick={(e) => handleAnalyze(e, product)}
                            disabled={analyzingId === product.id}
                            className="col-span-1 py-3 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded font-medium text-xs transition-colors flex items-center justify-center"
                        >
                            {analyzingId === product.id ? <span className="animate-spin">⟳</span> : <Sparkles size={18} />}
                        </button>

                        <button
                            onClick={() => onInvest(product)}
                            disabled={user.balance < product.price}
                            className={`col-span-4 py-3 rounded font-bold text-base shadow-lg transition-all flex items-center justify-center uppercase tracking-wide ${
                                user.balance >= product.price 
                                    ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {user.balance >= product.price ? 'Invest Now' : `Need ₹${(product.price - user.balance).toFixed(2)}`}
                        </button>
                    </div>
                </div>
            </div>
            ))}
        </div>
      ) : (
        /* Profit Table View */
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-amber-200">
            <div className="bg-[#2c1810] text-white p-3 text-center font-bold text-sm uppercase tracking-wider">
                (Royal Hub) Product Profit Statement
            </div>
            <table className="w-full min-w-[600px] text-xs">
                <thead>
                    <tr className="bg-amber-100 text-amber-900">
                        <th className="p-2 text-left font-bold border-b border-amber-200">Product Name</th>
                        <th className="p-2 text-right font-bold border-b border-amber-200">Price</th>
                        <th className="p-2 text-center font-bold border-b border-amber-200">Daily %</th>
                        <th className="p-2 text-right font-bold border-b border-amber-200">Daily Inc</th>
                        <th className="p-2 text-center font-bold border-b border-amber-200">Cycle</th>
                        <th className="p-2 text-right font-bold border-b border-amber-200">Total Inc</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((p, i) => (
                        <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}>
                            <td className="p-2 font-medium text-gray-800 border-b border-gray-100">{p.name}</td>
                            <td className="p-2 text-right font-bold text-gray-700 border-b border-gray-100">{p.price} RS</td>
                            <td className="p-2 text-center text-gray-600 border-b border-gray-100">{calculateROI(p)}%</td>
                            <td className="p-2 text-right font-semibold text-amber-700 border-b border-gray-100">{p.dailyIncome} RS</td>
                            <td className="p-2 text-center text-gray-600 border-b border-gray-100">{p.days} Day</td>
                            <td className="p-2 text-right font-bold text-green-700 border-b border-gray-100">{p.totalRevenue} RS</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="p-3 bg-amber-50 text-[10px] text-amber-800 leading-tight">
                Notes: 
                1. Principal + Income is returned daily or at end of cycle depending on product.
                2. Staff Principal is always managed by The Bank of India.
            </div>
        </div>
      )}
    </div>
  );
};