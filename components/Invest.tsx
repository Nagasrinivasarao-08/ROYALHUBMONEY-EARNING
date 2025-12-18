import React, { useState } from 'react';
import { Product, User } from '../types.ts';
import { analyzeProduct } from '../services/gemini.ts';
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
      <div className="flex bg-white rounded-lg p-1 shadow-sm border border-amber-100">
        <button 
            onClick={() => setViewMode('cards')}
            className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center ${viewMode === 'cards' ? 'bg-amber-600 text-white' : 'text-gray-500'}`}
        >
            <List size={16} className="mr-2" /> Products
        </button>
        <button 
            onClick={() => setViewMode('table')}
            className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center ${viewMode === 'table' ? 'bg-amber-600 text-white' : 'text-gray-500'}`}
        >
            <TableIcon size={16} className="mr-2" /> Profit Table
        </button>
      </div>

      <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start space-x-2">
        <Info className="text-amber-700 flex-shrink-0 mt-0.5" size={18} />
        <p className="text-xs text-amber-900 leading-relaxed">
            <strong>Royal Hub</strong> Product Profit Statement. 
            All Product Returns Can Be Collected Daily. 
        </p>
      </div>

      {viewMode === 'cards' ? (
        <div className="space-y-6">
            {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="h-48 relative">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <h3 className="text-xl font-bold text-white">{product.name}</h3>
                    </div>
                </div>
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
                        <div className="flex justify-between pt-2">
                             <span>Investment Amount</span>
                             <span className="text-white font-bold text-lg">₹{product.price}</span>
                        </div>
                    </div>

                    {analysisResult && analysisResult.id === product.id && (
                        <div className="mt-4 mb-2 bg-amber-900/30 p-3 rounded border border-amber-500/30 text-xs text-amber-200 animate-fadeIn">
                            <Sparkles size={12} className="inline mr-1 text-amber-400" /> {analysisResult.text}
                        </div>
                    )}

                    <div className="mt-5 grid grid-cols-5 gap-2">
                        <button onClick={(e) => handleAnalyze(e, product)} disabled={analyzingId === product.id} className="col-span-1 py-3 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-xl flex items-center justify-center">
                            {analyzingId === product.id ? <span className="animate-spin">⟳</span> : <Sparkles size={18} />}
                        </button>
                        <button onClick={() => onInvest(product)} disabled={user.balance < product.price} className={`col-span-4 py-3 rounded-xl font-bold text-base shadow-lg transition-all uppercase tracking-wide ${user.balance >= product.price ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
                            {user.balance >= product.price ? 'Invest Now' : `Need ₹${(product.price - user.balance).toFixed(2)}`}
                        </button>
                    </div>
                </div>
            </div>
            ))}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-amber-200">
            <table className="w-full text-xs">
                <thead>
                    <tr className="bg-amber-100 text-amber-900">
                        <th className="p-3 text-left">Product</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Daily</th>
                        <th className="p-3 text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((p, i) => (
                        <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-amber-50/30'}>
                            <td className="p-3 font-medium text-gray-800">{p.name}</td>
                            <td className="p-3 text-right font-bold">₹{p.price}</td>
                            <td className="p-3 text-right text-amber-700 font-bold">₹{p.dailyIncome}</td>
                            <td className="p-3 text-right text-green-700 font-bold">₹{p.totalRevenue}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
};