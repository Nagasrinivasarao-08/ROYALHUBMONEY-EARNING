
import React, { useState } from 'react';
import { User, AppSettings } from '../types';
import { QrCode, ArrowDownLeft, ArrowUpRight, History, Filter, ArrowUpDown, Gift, Copy, Check, TrendingUp, ShoppingBag, XCircle, CreditCard, Building, ArrowLeft, Info, RefreshCw } from 'lucide-react';

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
  const [withdrawInfo, setWithdrawInfo] = useState(''); 
  
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
      if (val < 200) return;
      if (val > user.balance) return;
      const cleanInfo = withdrawInfo.trim();
      if (!cleanInfo) return;

      onWithdraw(val, { 
          method: withdrawMethod, 
          details: cleanInfo,
          info: cleanInfo 
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

  const formattedAmount = amount && !isNaN(Number(amount)) ? Number(amount).toFixed(2) : '0.00';
  
  // Logic to determine QR Display
  const getQrUrl = () => {
      if (settings.upiId && Number(amount) > 0) {
          const upiParams = new URLSearchParams();
          upiParams.append('pa', settings.upiId);
          upiParams.append('pn', 'Royal Hub'); 
          upiParams.append('am', formattedAmount);
          upiParams.append('cu', 'INR');
          upiParams.append('tn', 'Recharge');
          
          const upiLink = `upi://pay?${upiParams.toString()}`;
          return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;
      }
      return settings.qrCodeUrl || '';
  };

  const qrImage = getQrUrl();

  return (
    <div className="space-y-6">
      <div className="bg-[#2c1810] rounded-2xl p-6 text-white shadow-xl border-b-4 border-amber-600 relative overflow-hidden group">
        <div className="absolute top-[-20%] right-[-10%] opacity-5 group-hover:rotate-12 transition-all duration-1000">
            <TrendingUp size={180} />
        </div>
        <div className="relative z-10">
            <p className="text-amber-500/80 text-[10px] font-black mb-1 uppercase tracking-[0.2em]">Liquid Capital</p>
            <h2 className="text-4xl font-black mb-8 font-mono text-amber-400">₹{user.balance.toFixed(2)}</h2>
            
            <div className="flex gap-3">
                <button 
                    onClick={() => setShowRecharge(true)}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-[#1a0f0a] py-4 rounded-2xl font-black flex items-center justify-center transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-amber-500/20 active:scale-95"
                >
                    <QrCode className="mr-2" size={16} /> Recharge
                </button>
                <button 
                    onClick={() => setShowWithdraw(true)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-amber-100 py-4 rounded-2xl font-black flex items-center justify-center transition-all uppercase tracking-widest text-[10px] border border-white/10 active:scale-95"
                >
                    <ArrowUpRight className="mr-2" size={16} /> Withdraw
                </button>
            </div>
        </div>
      </div>

      {/* Recharge Modal */}
      {showRecharge && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-xl">
            <div className="bg-[#2c1810] border border-amber-900/30 rounded-[3rem] w-full max-w-sm overflow-hidden animate-bounce-in shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center">
                        {rechargeStep === 'qr' && (
                            <button 
                                onClick={() => setRechargeStep('amount')}
                                className="mr-3 text-amber-500 hover:text-white transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Wallet Inflow</h3>
                    </div>
                    <button onClick={closeRecharge} className="text-white/20 hover:text-white transition-colors"><XCircle size={24}/></button>
                </div>
                
                <div className="p-8">
                    {rechargeStep === 'amount' ? (
                        <div className="space-y-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-200/40 text-center">Define Investment Volume</p>
                            <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5">
                                <label className="block text-[9px] font-black text-amber-500 mb-2 uppercase tracking-widest ml-1">Capital Amount (₹)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-transparent border-b border-white/10 py-3 text-4xl font-black text-center text-amber-400 focus:border-amber-500 outline-none transition-all font-mono"
                                    placeholder="500"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[500, 1000, 2000, 5000, 10000, 20000].map(val => (
                                    <button 
                                        key={val}
                                        onClick={() => setAmount(val.toString())}
                                        className="py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black text-amber-200 hover:bg-amber-500 hover:text-black transition-all"
                                    >
                                        ₹{val}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleAmountSubmit}
                                disabled={!amount || Number(amount) <= 0}
                                className="w-full bg-amber-500 text-[#1a0f0a] py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50 transition-all mt-4"
                            >
                                Generate Gateway
                            </button>
                        </div>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="bg-white p-5 rounded-[2.5rem] shadow-inner border border-white/10 inline-block relative group animate-bounce-in">
                                <img 
                                    src={qrImage}
                                    alt="Payment QR"
                                    className="w-48 h-48 object-contain"
                                />
                            </div>
                            <div>
                                <p className="text-amber-500 font-black text-4xl font-mono">₹{formattedAmount}</p>
                                <p className="text-[10px] text-amber-200/30 mt-2 uppercase tracking-widest">
                                    {settings.upiId ? 'Encrypted UPI Gateway Ready' : 'Global Static QR Gateway'}
                                </p>
                                
                                {settings.upiId && (
                                    <div className="flex items-center justify-center mt-4 space-x-3 bg-white/5 py-3 px-6 rounded-full mx-auto w-fit max-w-full border border-white/10">
                                        <span className="text-[10px] text-amber-200/60 font-mono truncate max-w-[150px]">{settings.upiId}</span>
                                        <button onClick={copyUpi} className="text-amber-500 hover:text-white transition-colors">
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                             <div className="bg-amber-500/5 text-amber-500/60 p-4 rounded-2xl text-[9px] border border-amber-500/20 font-bold uppercase leading-relaxed tracking-wider">
                                <p><strong>Status: Verification Pending</strong></p>
                                <p className="mt-1">Notify node after transfer. Admin confirmation required for vault credit.</p>
                            </div>
                            
                            <div className="pt-2">
                                <button
                                    onClick={handlePaymentComplete}
                                    disabled={isProcessing}
                                    className="w-full bg-amber-500 text-black py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center"
                                >
                                    {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : 'Signal Transfer Complete'}
                                </button>
                                <button 
                                    onClick={() => setRechargeStep('amount')}
                                    className="mt-4 text-[9px] font-black text-white/20 hover:text-white uppercase tracking-[0.2em] transition-all"
                                >
                                    Re-calibrate Capital
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
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-xl">
            <div className="bg-[#2c1810] border border-amber-900/30 rounded-[3rem] w-full max-w-sm overflow-hidden animate-bounce-in shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Capital Outflow</h3>
                    <button onClick={closeWithdraw} className="text-white/20 hover:text-white transition-colors"><XCircle size={24}/></button>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5">
                         <div className="flex justify-between items-end mb-2 px-1">
                            <label className="block text-[9px] font-black text-amber-500 uppercase tracking-widest">Withdraw Volume (₹)</label>
                            <span className="text-[8px] text-amber-200/30 font-bold uppercase">Limit: ₹200+</span>
                        </div>
                        <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="w-full bg-transparent border-b border-white/10 py-3 text-4xl font-black text-center text-amber-400 focus:border-amber-500 outline-none transition-all font-mono"
                            placeholder="0"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-[9px] font-black text-amber-200/30 uppercase tracking-[0.2em] mb-3 ml-1">Destination Gateway</label>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button 
                                onClick={() => setWithdrawMethod('upi')}
                                className={`flex items-center justify-center py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                    withdrawMethod === 'upi' ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 border-white/5 text-amber-200/30'
                                }`}
                            >
                                <QrCode size={14} className="mr-2"/> UPI ID
                            </button>
                            <button 
                                onClick={() => setWithdrawMethod('bank')}
                                className={`flex items-center justify-center py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                    withdrawMethod === 'bank' ? 'bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 border-white/5 text-amber-200/30'
                                }`}
                            >
                                <Building size={14} className="mr-2"/> Bank Node
                            </button>
                        </div>
                        
                        <div className="bg-black/40 p-5 rounded-[2rem] border border-white/5">
                          {withdrawMethod === 'upi' ? (
                              <input 
                                  type="text"
                                  value={withdrawInfo}
                                  onChange={(e) => setWithdrawInfo(e.target.value)}
                                  placeholder="Enter UPI ID (e.g. user@ybl)"
                                  className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-amber-100 font-bold placeholder-white/10 focus:border-amber-500 outline-none transition-all"
                              />
                          ) : (
                              <textarea 
                                  value={withdrawInfo}
                                  onChange={(e) => setWithdrawInfo(e.target.value)}
                                  placeholder="Acc No, IFSC, Holder Name"
                                  className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-amber-100 font-bold placeholder-white/10 focus:border-amber-500 outline-none h-20 resize-none no-scrollbar"
                              />
                          )}
                        </div>
                    </div>
                    
                    {Number(withdrawAmount) > 0 && (
                        <div className="bg-black/40 p-4 rounded-2xl text-[9px] space-y-2 border border-white/5 font-bold uppercase tracking-wider">
                             <div className="flex justify-between text-rose-500">
                                <span>Network Fee ({feePercentage}%):</span>
                                <span>-₹{withdrawFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-amber-400 pt-2 border-t border-white/5">
                                <span>Net Settlement:</span>
                                <span>₹{withdrawReceive.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleWithdrawSubmit}
                        disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) < 200 || Number(withdrawAmount) > user.balance || !withdrawInfo.trim()}
                        className="w-full bg-amber-500 text-[#1a0f0a] py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50 transition-all"
                    >
                         {Number(withdrawAmount) > user.balance 
                            ? 'Exceeds Reserves' 
                            : Number(withdrawAmount) > 0 && Number(withdrawAmount) < 200 
                                ? 'Minimum ₹200'
                                : 'Authorize Disbursement'}
                    </button>
                     <p className="text-[8px] text-center text-amber-200/20 font-black uppercase tracking-widest">
                        Node latency: 0-24 hours. Verification required.
                    </p>
                </div>
            </div>
        </div>
      )}

      <div>
          <h3 className="text-amber-500/40 font-black text-[10px] mb-4 flex items-center uppercase tracking-[0.3em] px-2">
              <History size={12} className="mr-2" /> Financial Audit Trail
          </h3>

          {/* Filters & Sorting */}
          <div className="bg-[#2c1810] border border-amber-900/30 p-3 rounded-2xl shadow-xl mb-4">
              <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="relative">
                      <select 
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-4 pr-10 text-[9px] font-black uppercase tracking-widest text-amber-200/60 focus:outline-none focus:border-amber-500 appearance-none transition-all"
                      >
                          <option value="all">All Logs</option>
                          <option value="recharge">Inflow</option>
                          <option value="income">Yields</option>
                          <option value="investment">Allocation</option>
                          <option value="withdrawal">Outflow</option>
                          <option value="referral">Bonus</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-amber-500/30">
                        <Filter size={14} />
                      </div>
                  </div>

                  <div className="relative">
                      <select 
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-4 pr-10 text-[9px] font-black uppercase tracking-widest text-amber-200/60 focus:outline-none focus:border-amber-500 appearance-none transition-all"
                      >
                          <option value="date-desc">Newest First</option>
                          <option value="date-asc">Chronological</option>
                          <option value="amount-desc">High Volume</option>
                          <option value="amount-asc">Low Volume</option>
                      </select>
                       <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-amber-500/30">
                         <ArrowUpDown size={14} />
                      </div>
                  </div>
              </div>
          </div>

          <div className="space-y-3">
              {filteredTransactions.length === 0 ? (
                  <div className="text-center py-16 bg-[#2c1810]/40 rounded-[3rem] border border-dashed border-amber-900/20">
                      <Info size={40} className="mx-auto text-amber-500/10 mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-200/20">No matching logs detected</p>
                  </div>
              ) : (
                  filteredTransactions.map((tx) => (
                      <div key={tx.id} className="bg-[#2c1810] border border-amber-900/30 p-5 rounded-[2rem] flex items-center justify-between shadow-lg group hover:border-amber-500/50 transition-all">
                          <div className="flex items-center">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 border ${
                                    tx.type === 'recharge' ? 'bg-green-500/5 border-green-500/20 text-green-500' :
                                    tx.type === 'income' ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' :
                                    tx.type === 'referral' ? 'bg-purple-500/5 border-purple-500/20 text-purple-500' :
                                    tx.type === 'investment' ? 'bg-blue-500/5 border-blue-500/20 text-blue-500' :
                                    'bg-rose-500/5 border-rose-500/20 text-rose-500'
                                }`}>
                                    {tx.type === 'recharge' && <ArrowDownLeft size={18} />}
                                    {tx.type === 'income' && <TrendingUp size={18} />}
                                    {tx.type === 'referral' && <Gift size={18} />}
                                    {tx.type === 'investment' && <ShoppingBag size={18} />}
                                    {tx.type === 'withdrawal' && <ArrowUpRight size={18} />}
                                </div>
                                <div>
                                    <p className="font-black text-white uppercase text-[11px] tracking-tight">
                                        {tx.type === 'referral' ? 'Referral Payout' : tx.type}
                                    </p>
                                    <p className="text-[9px] text-amber-200/20 font-mono tracking-tighter mt-1">{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                </div>
                          </div>
                          <div className="text-right">
                              <div className={`font-black font-mono text-sm ${
                                  tx.type === 'recharge' || tx.type === 'income' || tx.type === 'referral'
                                  ? 'text-amber-500' 
                                  : 'text-white'
                              }`}>
                                  {tx.type === 'recharge' || tx.type === 'income' || tx.type === 'referral' ? '+' : '-'}₹{tx.amount.toFixed(0)}
                              </div>
                              <span className={`text-[8px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full mt-1.5 inline-block ${
                                  tx.status === 'success' ? 'bg-green-500/10 text-green-500' : 
                                  tx.status === 'rejected' ? 'bg-rose-500/10 text-rose-500' :
                                  'bg-amber-500/10 text-amber-500'
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
