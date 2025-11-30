import React, { useEffect, useState } from 'react';
import { User, Product } from '../types';
import { TrendingUp, DollarSign, Clock, Zap, Wallet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  user: User;
  products: Product[];
  onClaim: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, products, onClaim }) => {
  const [canClaim, setCanClaim] = useState(false);
  const [nextClaimTime, setNextClaimTime] = useState<string>('');
  const [isClaiming, setIsClaiming] = useState(false);

  const totalInvested = user.investments.reduce((sum, inv) => {
    // Use snapshot price if available, otherwise fallback (though snapshot should always exist for new logic)
    return sum + (inv.productSnapshot?.price || 0);
  }, 0);

  const totalDailyIncome = user.investments.reduce((sum, inv) => {
    return sum + (inv.productSnapshot?.dailyIncome || 0);
  }, 0);

  // Helper to format milliseconds into HH:MM:SS
  const formatTimeLeft = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleClaimClick = async () => {
    setIsClaiming(true);
    // Add a small delay for better UX so the user sees the processing state
    await new Promise(resolve => setTimeout(resolve, 800));
    onClaim();
    setIsClaiming(false);
  };

  // Check if any earnings are claimable
  useEffect(() => {
    const checkClaimable = () => {
      let claimable = false;
      let minNextTime = Infinity;
      const CLAIM_INTERVAL = 24 * 60 * 60 * 1000; // 24 Hours

      user.investments.forEach(inv => {
        const lastClaim = new Date(inv.lastClaimDate).getTime();
        const now = Date.now();
        const elapsed = now - lastClaim;

        if (elapsed >= CLAIM_INTERVAL) {
          claimable = true;
        } else {
            const nextTime = lastClaim + CLAIM_INTERVAL;
            if (nextTime < minNextTime) minNextTime = nextTime;
        }
      });

      setCanClaim(claimable);
      
      if (!claimable && minNextTime !== Infinity) {
          const timeLeft = minNextTime - Date.now();
          if (timeLeft > 0) {
              setNextClaimTime(formatTimeLeft(timeLeft));
          } else {
              setNextClaimTime('00:00:00');
          }
      } else {
          setNextClaimTime('');
      }
    };

    checkClaimable();
    const interval = setInterval(checkClaimable, 1000);
    return () => clearInterval(interval);
  }, [user.investments]);

  // Mock data for the chart
  const data = [
    { name: 'Mon', income: 400 },
    { name: 'Tue', income: 300 },
    { name: 'Wed', income: 600 },
    { name: 'Thu', income: 800 },
    { name: 'Fri', income: 500 },
    { name: 'Sat', income: 900 },
    { name: 'Sun', income: totalDailyIncome > 0 ? totalDailyIncome + 500 : 200 },
  ];

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-[#2c1810] rounded-xl p-6 text-white shadow-xl relative overflow-hidden border-b-4 border-amber-600">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <DollarSign size={120} color="#fbbf24" />
        </div>
        <div className="relative z-10">
          <p className="text-amber-500/80 text-sm font-medium mb-1 uppercase tracking-wider">Total Asset Balance</p>
          <h1 className="text-4xl font-bold mb-6 font-mono text-amber-400">₹{user.balance.toFixed(2)}</h1>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <p className="text-xs text-gray-300">Daily Profit</p>
              <p className="font-semibold text-lg flex items-center text-white">
                <TrendingUp size={16} className="mr-1 text-green-400" />
                ₹{totalDailyIncome.toFixed(2)}
              </p>
            </div>
             <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <p className="text-xs text-gray-300">Total Invested</p>
              <p className="font-semibold text-lg text-white">
                ₹{totalInvested.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button - Styled like screenshot "Waiting for Profit" */}
      <div className="grid grid-cols-1 gap-3">
        <button
            onClick={handleClaimClick}
            disabled={!canClaim || isClaiming}
            className={`w-full py-4 rounded-sm font-bold text-lg shadow-md flex items-center justify-center transition-all uppercase tracking-wide ${
            canClaim && !isClaiming
                ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse' 
                : 'bg-amber-400/50 text-white cursor-not-allowed'
            }`}
        >
            {isClaiming ? (
                <>
                   <span className="animate-spin mr-2">⟳</span> Processing...
                </>
            ) : canClaim ? 'Collect Profit' : (nextClaimTime ? `Wait: ${nextClaimTime}` : 'Waiting For Profit')}
        </button>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-amber-100">
        <h3 className="text-[#2c1810] font-semibold mb-4 flex items-center">
            <TrendingUp size={18} className="mr-2 text-amber-600"/>
            Profit Trend
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fef3c7" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#92400e'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#92400e'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #fcd34d', backgroundColor: '#fffbeb', color: '#78350f' }}
                cursor={{ stroke: '#d97706', strokeWidth: 2 }}
              />
              <Area type="monotone" dataKey="income" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Investments */}
      <div>
        <h3 className="text-[#2c1810] font-bold mb-3 border-l-4 border-amber-600 pl-2">My Devices</h3>
        <div className="space-y-4">
          {user.investments.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-400 text-sm">No active investments yet.</p>
            </div>
          ) : (
            user.investments.map((inv) => {
              // Priority: Use Snapshot, Fallback: Look up current products, Final: Placeholder
              const productSnapshot = inv.productSnapshot;
              const currentProduct = products.find(p => p.id === inv.productId);
              
              // If we have neither snapshot nor current product, this is an orphaned record
              if (!productSnapshot && !currentProduct) {
                  return (
                      <div key={inv.id} className="bg-white rounded-lg p-4 border border-red-100">
                          <p className="text-red-500 text-sm">Discontinued Product (ID: {inv.productId})</p>
                      </div>
                  );
              }

              // Use snapshot data if available for consistency, else fall back to current
              const name = productSnapshot?.name || currentProduct?.name;
              const image = productSnapshot?.image || currentProduct?.image;
              const dailyIncome = productSnapshot?.dailyIncome || currentProduct?.dailyIncome;
              const totalRevenue = productSnapshot?.totalRevenue || currentProduct?.totalRevenue;
              const days = productSnapshot?.days || currentProduct?.days || 30;

              const now = new Date();
              const purchaseDate = new Date(inv.purchaseDate);
              const endDate = new Date(purchaseDate);
              endDate.setDate(endDate.getDate() + days);
              
              const daysPassed = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
              const progress = Math.min(100, Math.max(0, (daysPassed / days) * 100));

              return (
                <div key={inv.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex">
                        <div className="w-1/3 h-32 relative">
                            <img src={image} alt={name} className="w-full h-full object-cover" />
                        </div>
                        <div className="w-2/3 p-3 flex flex-col justify-between">
                            <div>
                                <h4 className="font-bold text-[#2c1810] text-lg">{name}</h4>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                    <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                            <div className="text-xs space-y-1 mt-2 text-gray-600">
                                <p>Lease Time: <span className="font-semibold">{days} Days</span></p>
                                <p>Expiration: {endDate.toLocaleDateString()}</p>
                                <p>Get Time: {purchaseDate.toLocaleDateString()} {purchaseDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#2c1810] text-white p-2 flex justify-between items-center text-sm px-4">
                         <span>Daily: ₹{dailyIncome}</span>
                         <span className="text-amber-400 font-bold">Total: ₹{totalRevenue}</span>
                    </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};