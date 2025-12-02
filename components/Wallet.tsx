

import React, { useState } from 'react';
import { User, AppSettings } from '../types';
import { QrCode, ArrowDownLeft, ArrowUpRight, History, Filter, ArrowUpDown, Gift, Copy, Check, TrendingUp, ShoppingBag, XCircle, CreditCard, Building, ArrowLeft } from 'lucide-react';

interface WalletProps {
  user: User;
  settings: AppSettings;
  onRecharge: (amount: number) => void;
  onWithdraw: (amount: number, details: { method: 'upi' | 'bank', details: string, info?: string }) => void;
}

export const Wallet: React.FC<WalletProps> = ({ user, settings, onRecharge, onWithdraw }) => {
  // Recharge State
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeStep, setRechargeStep] = useState<'amount' | 'qr'>('amount');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Withdraw State
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'bank'>('upi');
  const [withdrawInfo, setWithdrawInfo] = useState(''); // Stores UPI ID or Bank Details string
  
  // Filter and Sort State
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  // Recharge Handlers
  const handleAmountSubmit = () => {
      if (!amount || isNaN(Number(amount))) return;
      setRechargeStep('qr');
  }

  const handlePaymentComplete = () => {
    setIsProcessing(true);
    setTimeout(() => {
        onRecharge(Number(amount));
        setIsProcessing(false);
        setShowRecharge(false);
        setAmount('');
        setRechargeStep('amount');
    }, 1000);
  };

  const closeRecharge = () => {
      setShowRecharge(false);
      setRechargeStep('amount');
      setAmount('');
  }

  const copyUpi = () => {
      if (settings.upiId) {
          navigator.clipboard.writeText(settings.upiId);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  }

  // Withdraw Handlers
  const handleWithdrawSubmit = () => {
      const val = Number(withdrawAmount);
      if (!withdrawAmount || isNaN(val) || val <= 0) return;
      if (val < 200) {
          alert("Minimum withdrawal amount is ₹200");
          return;
      }
      if (val > user.balance) return;
      if (!withdrawInfo.trim()) return;

      // Fix: Send both 'details' AND 'info' to ensure the backend captures it regardless of schema version
      onWithdraw(val, { 
          method: withdrawMethod, 
          details: withdrawInfo,
          info: withdrawInfo 
      });
      setShowWithdraw(false);
      setWithdrawAmount('');
      setWithdrawInfo('');
  };

  const closeWithdraw = () => {
      setShowWithdraw(false);
      setWithdrawAmount('');
      setWithdrawInfo('');
  }

  const feePercentage = settings.withdrawalFeePercentage ?? 5;
  const withdrawFee = Number(withdrawAmount) * (feePercentage / 100);
  const withdrawReceive = Number(withdrawAmount) - withdrawFee;

  // Filter and Sort Logic
  const filteredTransactions = user.transactions
    .filter(tx => filterType === 'all' ? true : tx.type === filterType)
    .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
    });

  const getFilterLabel = (type: string) => {
      switch(type) {
          case 'recharge': return 'Recharges';
          case 'income': return 'Income';
          case 'investment': return 'Investments';
          case 'withdrawal': return 'Withdrawals';
          case 'referral': return 'Referral Bonuses';
          default: return 'All Transactions';
      }
  }

  const formattedAmount = amount && !isNaN(Number(amount)) ? Number(amount).toFixed(2) : '0.00';
  
  // Logic to determine QR Display
  const getQrUrl = () => {
      if (settings.upiId && Number(amount) > 0) {
          const upiLink = `upi://pay?pa=${settings.upiId}&pn=RoyalHub&am=${formattedAmount}&cu=INR&tn=Recharge`;
          return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
      }
      return settings.qrCodeUrl;
  };

  const qrImage = getQrUrl();

  return (
    <div className="space-y-6">
      <div className="bg-[#2c1810] rounded-xl p-6 text-white shadow-lg border-b-4 border-amber-600">
        <p className="text-amber-500/80 text-sm mb-1 uppercase tracking-widest">My Balance</p>
        <h2 className="text-4xl font-bold mb-8 font-mono">₹{user.balance.toFixed(2)}</h2>
        
        <div className="flex gap-4">
            <button 
                onClick={() => setShowRecharge(true)}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-lg font-bold flex items-center justify-center transition-colors uppercase tracking-wide shadow-lg"
            >
                <QrCode className="mr-2" size={20} /> Recharge
            </button>
            <button 
                onClick={() => setShowWithdraw(true)}
                className="flex-1 bg-[#4a2c20] hover:bg-[#5d3829] text-amber-100 py-3 rounded-lg font-bold flex items-center justify-center transition-colors uppercase tracking-wide border border-[#5d3829]"
            >
                <ArrowUpRight className="mr-2" size={20} /> Withdraw
            </button>
        </div>
      </div>

      {/* Recharge Modal */}
      {showRecharge && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden animate-bounce-in shadow-2xl">
                <div className="bg-[#2c1810] text-white p-4 flex justify-between items-center">
                    <div className="flex items-center">
                        {rechargeStep === 'qr' && (
                            <button 
                                onClick={() => setRechargeStep('amount')}
                                className="mr-3 text-gray-300 hover:text-white transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h3 className="text-lg font-bold">Wallet Recharge</h3>
                    </div>
                    <button onClick={closeRecharge} className="text-gray-400 hover:text-white">✕</button>
                </div>
                
                <div className="p-6">
                    {rechargeStep === 'amount' ? (
                        <div className="space-y-5">
                            <p className="text-sm text-gray-600 text-center">Enter amount to recharge</p>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Amount (₹)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full border-2 border-gray-200 rounded-lg p-3 text-2xl font-bold text-center focus:border-amber-500 outline-none"
                                    placeholder="500"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[500, 1000, 2000, 5000, 10000, 20000].map(val => (
                                    <button 
                                        key={val}
                                        onClick={() => setAmount(val.toString())}
                                        className="py-2 bg-gray-50 border border-gray-200 rounded text-sm font-medium hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700"
                                    >
                                        ₹{val}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleAmountSubmit}
                                disabled={!amount || Number(amount) <= 0}
                                className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-lg font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                Next
                            </button>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-200 inline-block relative group">
                                <img 
                                    src={qrImage}
                                    alt="Payment QR"
                                    className="w-48 h-48 object-contain"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-xl">
                                    <span className="text-xs font-bold text-gray-800">Scan to Pay</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-amber-600 font-bold text-3xl">₹{formattedAmount}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {settings.upiId ? 'Dynamic QR with amount generated' : 'Scan the Admin QR Code'}
                                </p>
                                
                                {settings.upiId && (
                                    <div className="flex items-center justify-center mt-2 space-x-2 bg-gray-100 py-1.5 px-3 rounded-full mx-auto w-fit max-w-[90%]">
                                        <span className="text-[10px] text-gray-500 font-mono truncate max-w-[150px]">{settings.upiId}</span>
                                        <button onClick={copyUpi} className="text-amber-600 hover:text-amber-800 transition-colors">
                                            {copied ? <Check size={12} /> : <Copy size={12} />}
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                             <div className="bg-yellow-50 text-yellow-800 p-2 rounded text-[10px] border border-yellow-200">
                                <p><strong>Status: Pending</strong></p>
                                <p>After payment, click button below. Admin will approve shortly.</p>
                            </div>
                            
                            <div className="pt-2">
                                <button
                                    onClick={handlePaymentComplete}
                                    disabled={isProcessing}
                                    className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold shadow-md transition-all disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isProcessing ? (
                                        <>
                                            <span className="animate-spin mr-2">⟳</span> Submitting...
                                        </>
                                    ) : 'I Have Paid'}
                                </button>
                                <button 
                                    onClick={() => setRechargeStep('amount')}
                                    className="mt-3 text-sm text-gray-500 hover:text-gray-800 underline"
                                >
                                    Change Amount
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden animate-bounce-in shadow-2xl">
                <div className="bg-[#2c1810] text-white p-4 flex justify-between items-center">
                    <h3 className="text-lg font-bold">Withdraw Balance</h3>
                    <button onClick={closeWithdraw} className="text-gray-400 hover:text-white">✕</button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                         <div className="flex justify-between items-end mb-1">
                            <label className="block text-xs font-bold text-gray-700 uppercase">Amount (₹)</label>
                            <span className="text-xs text-amber-600 font-semibold">Min: ₹200 | Max: ₹{user.balance.toFixed(2)}</span>
                        </div>
                        <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-lg p-3 text-2xl font-bold text-center focus:border-amber-500 outline-none"
                            placeholder="0"
                            autoFocus
                        />
                    </div>

                    {/* Method Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Withdraw To</label>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <button 
                                onClick={() => setWithdrawMethod('upi')}
                                className={`flex items-center justify-center p-2 rounded-lg border text-sm font-medium transition-colors ${
                                    withdrawMethod === 'upi' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-gray-200 text-gray-500'
                                }`}
                            >
                                <QrCode size={16} className="mr-2"/> UPI ID
                            </button>
                            <button 
                                onClick={() => setWithdrawMethod('bank')}
                                className={`flex items-center justify-center p-2 rounded-lg border text-sm font-medium transition-colors ${
                                    withdrawMethod === 'bank' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-gray-200 text-gray-500'
                                }`}
                            >
                                <Building size={16} className="mr-2"/> Bank Transfer
                            </button>
                        </div>
                        
                        {withdrawMethod === 'upi' ? (
                            <input 
                                type="text"
                                value={withdrawInfo}
                                onChange={(e) => setWithdrawInfo(e.target.value)}
                                placeholder="Enter UPI ID (e.g. user@ybl)"
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:border-amber-500 outline-none"
                            />
                        ) : (
                            <textarea 
                                value={withdrawInfo}
                                onChange={(e) => setWithdrawInfo(e.target.value)}
                                placeholder="Account No, IFSC, Holder Name"
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:border-amber-500 outline-none h-20 resize-none"
                            />
                        )}
                    </div>
                    
                    {Number(withdrawAmount) > 0 && (
                        <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-2 border border-gray-100">
                             <div className="flex justify-between text-red-500">
                                <span>Service Fee ({feePercentage}%):</span>
                                <span>-₹{withdrawFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-gray-800 pt-2 border-t border-gray-200">
                                <span>You Receive:</span>
                                <span>₹{withdrawReceive.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleWithdrawSubmit}
                        disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) < 200 || Number(withdrawAmount) > user.balance || !withdrawInfo.trim()}
                        className="w-full bg-[#2c1810] hover:bg-gray-800 text-white py-3 rounded-lg font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {Number(withdrawAmount) > user.balance 
                            ? 'Insufficient Balance' 
                            : Number(withdrawAmount) > 0 && Number(withdrawAmount) < 200 
                                ? 'Min Withdrawal ₹200'
                                : 'Confirm Withdrawal'}
                    </button>
                     <p className="text-[10px] text-center text-gray-400">
                        Processed within 24 hours. Admin approval required.
                    </p>
                </div>
            </div>
        </div>
      )}

      <div>
          <h3 className="text-[#2c1810] font-bold mb-4 flex items-center border-l-4 border-amber-600 pl-2">
              <History size={18} className="mr-2" /> Recent Transactions
          </h3>

          {/* Filters & Sorting */}
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 mb-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter size={14} className="text-amber-600" />
                      </div>
                      <select 
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                      >
                          <option value="all">All Types</option>
                          <option value="recharge">Recharge</option>
                          <option value="income">Income</option>
                          <option value="investment">Investment</option>
                          <option value="withdrawal">Withdrawal</option>
                          <option value="referral">Referral Bonus</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <ArrowUpDown size={12} />
                      </div>
                  </div>

                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ArrowUpDown size={14} className="text-amber-600" />
                      </div>
                      <select 
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none"
                      >
                          <option value="date-desc">Newest First</option>
                          <option value="date-asc">Oldest First</option>
                          <option value="amount-desc">Amount: High-Low</option>
                          <option value="amount-asc">Amount: Low-High</option>
                      </select>
                       <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                         <ArrowUpDown size={12} />
                      </div>
                  </div>
              </div>

              {/* Result Summary */}
              <div className="flex justify-between items-center text-xs px-1 border-t border-gray-100 pt-2">
                <span className="text-gray-500 font-medium">
                    Showing <span className="text-gray-800 font-bold">{filteredTransactions.length}</span> {getFilterLabel(filterType)}
                </span>
                {filterType !== 'all' && (
                    <button 
                        onClick={() => setFilterType('all')} 
                        className="text-amber-600 hover:text-amber-800 font-medium flex items-center"
                    >
                        <XCircle size={12} className="mr-1" /> Clear Filter
                    </button>
                )}
              </div>
          </div>

          <div className="space-y-3">
              {filteredTransactions.length === 0 ? (
                  <p className="text-gray-400 text-center py-8 bg-white rounded-lg border border-dashed border-amber-100 text-sm">
                      {filterType === 'all' ? 'No transactions yet.' : `No ${filterType} transactions found.`}
                  </p>
              ) : (
                  filteredTransactions.map((tx) => (
                      <div key={tx.id} className="bg-white p-4 rounded-lg border border-gray-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                    tx.type === 'recharge' ? 'bg-green-100 text-green-700' :
                                    tx.type === 'income' ? 'bg-amber-100 text-amber-700' :
                                    tx.type === 'referral' ? 'bg-purple-100 text-purple-700' :
                                    tx.type === 'investment' ? 'bg-blue-100 text-blue-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {tx.type === 'recharge' && <ArrowDownLeft size={18} />}
                                    {tx.type === 'income' && <TrendingUp size={18} />}
                                    {tx.type === 'referral' && <Gift size={18} />}
                                    {tx.type === 'investment' && <ShoppingBag size={18} />}
                                    {tx.type === 'withdrawal' && <ArrowUpRight size={18} />}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 capitalize text-sm">
                                        {tx.type === 'referral' ? 'Referral Bonus' : tx.type}
                                    </p>
                                    <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                                </div>
                          </div>
                          <div className="text-right">
                              <div className={`font-bold font-mono ${
                                  tx.type === 'recharge' || tx.type === 'income' || tx.type === 'referral'
                                  ? 'text-amber-600' 
                                  : 'text-gray-900'
                              }`}>
                                  {tx.type === 'recharge' || tx.type === 'income' || tx.type === 'referral' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                              </div>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                  tx.status === 'success' ? 'bg-green-100 text-green-700' : 
                                  tx.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                              }`}>
                                  {tx.status}
                              </span>
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>
    </div>
  );
};