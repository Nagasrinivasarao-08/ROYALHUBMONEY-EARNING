
import React, { useState, useMemo, useRef } from 'react';
import { Product, User, AppSettings } from '../types.ts';
import { 
  Plus, Trash2, Users, ShoppingBag, ArrowDownLeft, Settings, 
  Check, X, QrCode, DollarSign, Clock, 
  ShieldAlert, Image, Lock, AlertTriangle, 
  Edit, RefreshCw, Copy, CheckCircle2, Search,
  Activity, Database, CreditCard, ChevronRight,
  TrendingUp, ArrowUpRight, LogOut, Wallet, Upload, Eye
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  users: User[];
  products: Product[];
  settings: AppSettings;
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onApproveWithdrawal: (userId: string, txId: string) => void;
  onRejectWithdrawal: (userId: string, txId: string) => void;
  onApproveRecharge: (userId: string, txId: string) => void;
  onRejectRecharge: (userId: string, txId: string) => void;
  onNavigate: (tab: string) => void;
  onUpdateAdminCredentials: (email: string, password: string) => void;
  onResetData: () => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
}

type AdminView = 'dashboard' | 'users' | 'recharges' | 'withdrawals' | 'products' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
    users, 
    products, 
    settings, 
    onAddProduct, 
    onDeleteProduct, 
    onUpdateSettings,
    onApproveWithdrawal,
    onRejectWithdrawal,
    onApproveRecharge,
    onRejectRecharge,
    onUpdateUser,
    onResetData
}) => {
  const [view, setView] = useState<AdminView>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ balance: '', password: '' });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', price: 500, dailyIncome: 50, days: 30, description: 'Royal Asset', purchaseLimit: 1, image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop'
  });

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSettings({ ...settings, qrCodeUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Data Aggregation
  const stats = useMemo(() => {
    const regularUsers = users.filter(u => u.role !== 'admin');
    const allTxs = users.flatMap(u => (u.transactions || []).map(t => ({ ...t, user: u })));
    
    return {
      totalUsers: regularUsers.length,
      totalBalance: regularUsers.reduce((sum, u) => sum + (u.balance || 0), 0),
      totalRecharged: allTxs.filter(t => t.type === 'recharge' && t.status === 'success').reduce((sum, t) => sum + t.amount, 0),
      totalWithdrawn: allTxs.filter(t => t.type === 'withdrawal' && t.status === 'success').reduce((sum, t) => sum + t.amount, 0),
      pendingRecharges: allTxs.filter(t => t.type === 'recharge' && t.status === 'pending'),
      pendingWithdrawals: allTxs.filter(t => t.type === 'withdrawal' && t.status === 'pending'),
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.role !== 'admin' && 
      (u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
       u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  // View Renderers
  const DashboardView = () => (
    <div className="space-y-4 animate-bounce-in">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#2c1810] border border-amber-900/30 rounded-2xl p-4 shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/50 mb-1">Total Users</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-white">{stats.totalUsers}</h3>
            <Users size={20} className="text-amber-500/20 mb-1" />
          </div>
        </div>
        <div className="bg-[#2c1810] border border-amber-900/30 rounded-2xl p-4 shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/50 mb-1">Total Balance</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-amber-400">₹{stats.totalBalance.toLocaleString()}</h3>
            <Wallet size={20} className="text-amber-500/20 mb-1" />
          </div>
        </div>
      </div>

      <div className="bg-amber-600 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute right-[-10%] top-[-20%] opacity-10 group-hover:rotate-12 transition-transform duration-700">
            <TrendingUp size={160} />
        </div>
        <div className="relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-black/40 mb-2">Net Cash Flow</p>
            <h2 className="text-4xl font-black text-white mb-6">₹{(stats.totalRecharged - stats.totalWithdrawn).toLocaleString()}</h2>
            <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
                <div>
                    <p className="text-[9px] font-black uppercase text-white/60">Total Inflow</p>
                    <p className="text-lg font-black text-white">₹{stats.totalRecharged.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase text-white/60">Total Outflow</p>
                    <p className="text-lg font-black text-white">₹{stats.totalWithdrawn.toLocaleString()}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-[#2c1810] border border-amber-900/30 rounded-2xl p-5 shadow-xl">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center">
          <Activity size={12} className="mr-2" /> Recent System Logs
        </h4>
        <div className="space-y-3">
          {users.flatMap(u => u.transactions || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4).map(tx => (
            <div key={tx.id} className="flex items-center justify-between text-[11px] border-b border-white/5 pb-2 last:border-0 last:pb-0">
               <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'success' ? 'bg-green-500' : tx.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                  <span className="font-bold uppercase text-white/80">{tx.type}</span>
               </div>
               <span className="font-mono text-amber-500 font-bold">₹{tx.amount.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const RechargesView = () => (
    <div className="space-y-4 animate-bounce-in">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">Pending Recharge Verifications</h3>
        <span className="text-[10px] font-mono text-amber-500/50">{stats.pendingRecharges.length} WAITING</span>
      </div>
      {stats.pendingRecharges.length === 0 ? (
        <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center">
           <CheckCircle2 size={48} className="mx-auto text-green-500/20 mb-3" />
           <p className="text-[10px] font-black uppercase tracking-widest text-amber-200/20">All recharge requests cleared</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stats.pendingRecharges.map((tx: any) => (
            <div key={tx.id} className="bg-[#2c1810] border border-amber-900/30 p-5 rounded-3xl group transition-all hover:border-amber-500/50">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-sm text-white uppercase">{tx.user.username}</h4>
                    <p className="text-[10px] text-amber-200/30 font-mono tracking-tighter">{tx.user.email}</p>
                    <p className="text-[9px] text-amber-500/40 mt-1 uppercase font-bold">{new Date(tx.date).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-amber-500">₹{tx.amount}</p>
                    <p className="text-[9px] text-green-500 font-black uppercase tracking-widest mt-1">Check Proof</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button 
                    onClick={() => onRejectRecharge(tx.user.id, tx.id)}
                    className="flex-1 bg-rose-500/10 text-rose-500 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => onApproveRecharge(tx.user.id, tx.id)}
                    className="flex-1 bg-amber-500 text-[#1a0f0a] py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Confirm Payment
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const WithdrawalsView = () => (
    <div className="space-y-4 animate-bounce-in">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">Withdrawal Disbursement Queue</h3>
        <span className="text-[10px] font-mono text-amber-500/50">{stats.pendingWithdrawals.length} REQUESTS</span>
      </div>
      {stats.pendingWithdrawals.length === 0 ? (
        <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center">
           <Clock size={48} className="mx-auto text-amber-500/20 mb-3" />
           <p className="text-[10px] font-black uppercase tracking-widest text-amber-200/20">Withdrawal queue is currently empty</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stats.pendingWithdrawals.map((tx: any) => (
            <div key={tx.id} className="bg-[#2c1810] border border-amber-900/30 p-5 rounded-3xl">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-sm text-white uppercase">{tx.user.username}</h4>
                    <p className="text-[10px] text-amber-200/30 font-mono mb-4">{tx.user.email}</p>
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                        <p className="text-[9px] text-amber-200/30 uppercase font-black mb-1.5 flex items-center gap-1.5">
                            <Database size={10} /> Recipient Data
                        </p>
                        <p className="text-[11px] text-amber-100 font-mono leading-relaxed break-all">
                            {tx.withdrawalDetails || 'Unspecified account data'}
                        </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-amber-400">₹{tx.amount}</p>
                    <p className="text-[9px] text-amber-500/40 uppercase font-bold mt-1">Net Debit</p>
                  </div>
               </div>
               <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => onRejectWithdrawal(tx.user.id, tx.id)}
                    className="flex-1 bg-rose-500/10 text-rose-500 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-500/20"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => onApproveWithdrawal(tx.user.id, tx.id)}
                    className="flex-1 bg-amber-500 text-black py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20"
                  >
                    Process Payout
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const SettingsView = () => (
    <div className="space-y-6 animate-bounce-in pb-10">
      <div className="bg-[#2c1810] border border-amber-900/30 rounded-3xl p-6 space-y-6 shadow-2xl">
        <div className="flex items-center gap-3">
           <div className="bg-amber-500/20 p-2 rounded-xl">
             <QrCode size={18} className="text-amber-500" />
           </div>
           <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">Payment Gateway Configuration</h3>
        </div>
        
        <div className="space-y-4">
          <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
            <label className="text-[10px] font-black uppercase tracking-widest text-amber-200/30 block mb-2 ml-1">Admin UPI Receiver</label>
            <input 
              type="text" 
              defaultValue={settings.upiId}
              onBlur={(e) => onUpdateSettings({ ...settings, upiId: e.target.value })}
              className="w-full bg-transparent border-b border-white/20 p-2 text-sm focus:border-amber-500 outline-none transition-all text-amber-400 font-bold font-mono"
              placeholder="e.g. royalhub@paytm"
            />
            <p className="text-[9px] text-amber-200/20 mt-2 italic">This UPI ID will be used for all recharge requests.</p>
          </div>

          <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
            <label className="text-[10px] font-black uppercase tracking-widest text-amber-200/30 block mb-2 ml-1">Recharge QR Code</label>
            <div className="flex flex-col gap-4">
              <input 
                type="text" 
                value={settings.qrCodeUrl}
                onChange={(e) => onUpdateSettings({ ...settings, qrCodeUrl: e.target.value })}
                className="w-full bg-transparent border-b border-white/20 p-2 text-[11px] focus:border-amber-500 outline-none transition-all text-amber-100 font-mono"
                placeholder="https://imgur.com/your-qr.png"
              />
              <div className="flex items-center gap-3">
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-amber-500/10 text-amber-500 border border-amber-500/30 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-[#1a0f0a] transition-all"
                 >
                    <Upload size={14} /> Upload Static QR
                 </button>
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleQrUpload} 
                 />
              </div>
              <div className="mt-2 p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center">
                 {settings.qrCodeUrl ? (
                    <>
                        <img src={settings.qrCodeUrl} className="w-32 h-32 object-contain rounded-lg shadow-2xl border border-white/10" />
                        <span className="text-[9px] text-amber-200/40 uppercase font-black tracking-widest mt-3">Live Gateway Preview</span>
                    </>
                 ) : (
                    <div className="w-32 h-32 bg-white/5 rounded-lg border border-dashed border-white/10 flex flex-col items-center justify-center">
                        <Image size={24} className="text-white/10 mb-2" />
                        <span className="text-[8px] text-white/20 uppercase font-bold">No Image</span>
                    </div>
                 )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
              <label className="text-[10px] font-black uppercase tracking-widest text-amber-200/30 block mb-2 ml-1">Affiliate Bonus (%)</label>
              <input 
                type="number" 
                defaultValue={settings.referralBonusPercentage}
                onBlur={(e) => onUpdateSettings({ ...settings, referralBonusPercentage: parseInt(e.target.value) })}
                className="w-full bg-transparent border-b border-white/20 p-2 text-sm focus:border-amber-500 outline-none transition-all text-amber-400 font-bold font-mono"
              />
            </div>
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
              <label className="text-[10px] font-black uppercase tracking-widest text-amber-200/30 block mb-2 ml-1">Withdrawal Fee (%)</label>
              <input 
                type="number" 
                defaultValue={settings.withdrawalFeePercentage}
                onBlur={(e) => onUpdateSettings({ ...settings, withdrawalFeePercentage: parseInt(e.target.value) })}
                className="w-full bg-transparent border-b border-white/20 p-2 text-sm focus:border-amber-500 outline-none transition-all text-amber-400 font-bold font-mono"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
           <AlertTriangle size={18} className="text-rose-500" />
           <h3 className="text-xs font-black uppercase tracking-widest text-rose-500">Security & Master Control</h3>
        </div>
        <button 
          onClick={() => { if(confirm('Factory reset will destroy all user data and transactions. This is permanent. Proceed?')) onResetData(); }} 
          className="w-full bg-rose-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-rose-600/20"
        >
          Factory Reset Node
        </button>
      </div>
    </div>
  );

  const ProductsView = () => (
    <div className="space-y-4 animate-bounce-in">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">Asset Management Center</h3>
        <button 
            onClick={() => setShowAddProduct(true)}
            className="bg-amber-500 text-black p-2.5 rounded-2xl active:scale-90 transition-all shadow-xl shadow-amber-500/30"
        >
            <Plus size={20} />
        </button>
      </div>

      <div className="space-y-3">
        {products.map(product => (
          <div key={product.id} className="bg-[#2c1810] border border-amber-900/30 p-4 rounded-3xl flex items-center justify-between group">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                   <img src={product.image} className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                   <h4 className="font-black text-sm text-white uppercase">{product.name}</h4>
                   <div className="flex gap-3 mt-1">
                     <p className="text-[10px] text-amber-500 font-black tracking-widest">₹{product.price}</p>
                     <p className="text-[10px] text-amber-200/30 font-bold uppercase tracking-widest">ROI: ₹{product.dailyIncome}/Day</p>
                   </div>
                </div>
             </div>
             <button 
                onClick={() => { if(confirm('Destroy this asset blueprint?')) onDeleteProduct(product.id) }}
                className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl opacity-40 group-hover:opacity-100 transition-all active:scale-90"
             >
                <Trash2 size={18} />
             </button>
          </div>
        ))}
      </div>

      {showAddProduct && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] p-6 overflow-y-auto">
          <div className="max-w-sm mx-auto space-y-6 animate-bounce-in pt-12 pb-24">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black uppercase tracking-tighter text-amber-500">Forge New Royal Asset</h3>
               <button onClick={() => setShowAddProduct(false)} className="text-white/20 hover:text-white"><X size={28} /></button>
            </div>
            
            <div className="space-y-5 bg-[#2c1810] p-6 rounded-[32px] border border-amber-900/30 shadow-2xl">
               <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-200/30 mb-2 block">Asset Label</label>
                  <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-transparent border-b border-white/20 py-2 text-sm text-amber-400 font-bold outline-none focus:border-amber-500" placeholder="e.g. TITAN MINER X" />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-200/30 mb-2 block">Entry Cost (₹)</label>
                    <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseInt(e.target.value)})} className="w-full bg-transparent border-b border-white/20 py-2 text-sm text-amber-400 font-bold outline-none focus:border-amber-500 font-mono" />
                  </div>
                  <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-200/30 mb-2 block">Daily Yield (₹)</label>
                    <input type="number" value={newProduct.dailyIncome} onChange={e => setNewProduct({...newProduct, dailyIncome: parseInt(e.target.value)})} className="w-full bg-transparent border-b border-white/20 py-2 text-sm text-amber-400 font-bold outline-none focus:border-amber-500 font-mono" />
                  </div>
               </div>

               <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-200/30 mb-2 block">Active Duration (Days)</label>
                    <input type="number" value={newProduct.days} onChange={e => setNewProduct({...newProduct, days: parseInt(e.target.value)})} className="w-full bg-transparent border-b border-white/20 py-2 text-sm text-amber-400 font-bold outline-none focus:border-amber-500 font-mono" />
               </div>

               <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-200/30 mb-2 block">Blueprint Image URL</label>
                    <input type="text" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} className="w-full bg-transparent border-b border-white/20 py-2 text-[10px] text-amber-200/60 font-bold outline-none focus:border-amber-500" />
               </div>

               <button 
                onClick={() => { onAddProduct(newProduct as Product); setShowAddProduct(false); }}
                className="w-full bg-amber-500 text-[#1a0f0a] py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-amber-500/40 active:scale-95 transition-all mt-4"
               >
                 Authorize Asset Forge
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Premium Horizontal Navigation */}
      <div className="flex overflow-x-auto gap-2 no-scrollbar py-3 sticky top-0 bg-[#1a0f0a]/90 backdrop-blur-xl z-30 -mx-4 px-4 border-b border-amber-900/10">
        {(['dashboard', 'users', 'recharges', 'withdrawals', 'products', 'settings'] as AdminView[]).map((tab) => {
            const isActive = view === tab;
            return (
                <button
                    key={tab}
                    onClick={() => setView(tab)}
                    className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all flex items-center gap-2 border ${
                    isActive 
                        ? 'bg-amber-500 text-[#1a0f0a] border-amber-500 shadow-xl shadow-amber-500/20' 
                        : 'bg-white/5 text-amber-200/30 border-white/5 hover:bg-white/10'
                    }`}
                >
                    {tab === 'dashboard' && <Activity size={12} />}
                    {tab === 'users' && <Users size={12} />}
                    {tab === 'recharges' && <CreditCard size={12} />}
                    {tab === 'withdrawals' && <ArrowUpRight size={12} />}
                    {tab === 'products' && <ShoppingBag size={12} />}
                    {tab === 'settings' && <Settings size={12} />}
                    {tab}
                    {tab === 'recharges' && stats.pendingRecharges.length > 0 && (
                        <span className="w-1.5 h-1.5 bg-[#1a0f0a] rounded-full animate-pulse"></span>
                    )}
                </button>
            )
        })}
      </div>

      <div className="min-h-[60vh]">
        {view === 'dashboard' && <DashboardView />}
        {view === 'recharges' && <RechargesView />}
        {view === 'withdrawals' && <WithdrawalsView />}
        {view === 'settings' && <SettingsView />}
        {view === 'products' && <ProductsView />}
        
        {view === 'users' && (
          <div className="space-y-4 animate-bounce-in">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-500/30" size={20} />
              <input 
                type="text" 
                placeholder="Search Active Partners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#2c1810] border border-amber-900/30 rounded-full py-5 pl-16 pr-6 text-sm focus:border-amber-500 outline-none transition-all text-amber-400 font-bold placeholder-amber-500/10 shadow-xl"
              />
            </div>
            <div className="space-y-3">
              {filteredUsers.map(user => (
                <div 
                    key={user.id} 
                    className="bg-[#2c1810] border border-amber-900/30 p-5 rounded-[2rem] flex items-center justify-between group hover:border-amber-500 transition-all cursor-pointer shadow-lg active:scale-[0.98]" 
                    onClick={() => { setEditingUser(user); setEditForm({ balance: (user.balance || 0).toString(), password: '' }); }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
                       <span className="font-black text-amber-500 text-xl">{user.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white uppercase tracking-tight">{user.username}</h4>
                      <p className="text-[10px] text-amber-200/20 font-mono tracking-tighter mb-1">{user.email}</p>
                      <div className="flex gap-2 items-center">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">ACTIVE</span>
                        <p className="text-xs font-black text-amber-400">₹{(user.balance || 0).toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-2 hidden sm:block">
                         <p className="text-[8px] font-black text-amber-500/30 uppercase tracking-[0.2em]">Joined</p>
                         <p className="text-[10px] text-white/50 font-mono">{new Date(user.registeredAt).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight size={18} className="text-amber-500/20 group-hover:text-amber-500 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-6">
          <div className="bg-[#2c1810] border border-amber-900/30 rounded-[3rem] p-8 w-full max-w-sm animate-bounce-in shadow-[0_0_80px_rgba(0,0,0,0.5)] relative">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-500">Node Override: Partner Vault</h3>
              <button onClick={() => setEditingUser(null)} className="text-white/20 hover:text-white transition-colors"><X size={28} /></button>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col items-center mb-4">
                 <div className="w-24 h-24 rounded-[2rem] bg-amber-500/10 flex items-center justify-center border border-amber-500/30 mb-4 shadow-inner">
                    <span className="text-4xl font-black text-amber-500">{editingUser.username.charAt(0).toUpperCase()}</span>
                 </div>
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{editingUser.username}</h2>
                 <p className="text-[10px] text-amber-200/30 font-mono uppercase tracking-widest mt-1">Status: Operational</p>
              </div>

              <div className="space-y-4">
                <div className="bg-black/30 p-5 rounded-[2rem] border border-white/5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-amber-200/30 block mb-3 ml-1">Liquid Capital (₹)</label>
                  <input 
                    type="number" 
                    value={editForm.balance}
                    onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
                    className="w-full bg-transparent border-b border-white/10 py-2 text-3xl font-black text-amber-400 focus:border-amber-500 outline-none transition-all font-mono"
                  />
                </div>
                
                <div className="bg-black/30 p-5 rounded-[2rem] border border-white/5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-amber-200/30 block mb-3 ml-1">Authentication Override</label>
                  <input 
                    type="text" 
                    placeholder="Set new secret passkey..."
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-amber-100 font-bold placeholder-white/5 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={() => {
                  const updates: any = {};
                  if(editForm.balance !== '') updates.balance = parseFloat(editForm.balance);
                  if(editForm.password !== '') updates.password = editForm.password;
                  onUpdateUser(editingUser.id, updates);
                  setEditingUser(null);
                }}
                className="w-full bg-amber-500 text-[#1a0f0a] py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-amber-500/40 active:scale-95 transition-all"
              >
                Sync Vault Data
              </button>
              
              <button 
                className="w-full bg-rose-600/10 text-rose-500 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all opacity-40 hover:opacity-100"
                onClick={() => { if(confirm('Terminate partner account access permanently?')) setEditingUser(null); }}
              >
                Restrict Hub Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
