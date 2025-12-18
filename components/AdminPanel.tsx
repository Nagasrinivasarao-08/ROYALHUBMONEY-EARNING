
import React, { useState, useMemo } from 'react';
import { Product, User, AppSettings, Transaction } from '../types';
import { 
  Plus, Trash2, Users, ShoppingBag, ArrowDownLeft, Settings, 
  Check, X, QrCode, DollarSign, AlertCircle, Clock, 
  ShieldAlert, Image, Building, Lock, AlertTriangle, 
  Edit, RefreshCw, Copy, CheckCircle2, Search, UserX, 
  Link, Activity, Database, Server, CreditCard, ChevronRight,
  TrendingUp, ArrowUpRight
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
    onUpdateUser
}) => {
  const [view, setView] = useState<AdminView>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ balance: '', password: '' });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', price: 500, dailyIncome: 50, days: 30, description: 'Royal Asset', purchaseLimit: 1, image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop'
  });

  // Data Aggregation
  const stats = useMemo(() => {
    const regularUsers = users.filter(u => u.role !== 'admin');
    const allTxs = users.flatMap(u => u.transactions.map(t => ({ ...t, user: u })));
    
    return {
      totalUsers: regularUsers.length,
      totalBalance: regularUsers.reduce((sum, u) => sum + u.balance, 0),
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

  // Views
  const DashboardView = () => (
    <div className="space-y-4">
      <div className="bg-[#2c1810] border border-amber-900/30 rounded-2xl p-5 overflow-hidden relative shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-2 rounded-xl">
              <Activity size={20} className="text-amber-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">Node Status</h3>
              <p className="text-[10px] text-amber-200/40 font-mono">Real-time Financial Monitor</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">OPERATIONAL</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-black/20 p-4 rounded-2xl border border-white/5 group hover:border-amber-500/30 transition-all">
            <p className="text-[10px] text-amber-200/30 uppercase font-black tracking-widest mb-1">Total Liquidity</p>
            <p className="text-2xl font-black text-amber-400">₹{stats.totalBalance.toLocaleString()}</p>
          </div>
          <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] text-amber-200/30 uppercase font-black tracking-widest mb-1">Verified Partners</p>
            <p className="text-2xl font-black text-white">{stats.totalUsers}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
           <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 text-center">
              <ArrowDownLeft size={16} className="mx-auto text-green-500 mb-1" />
              <p className="text-[9px] text-amber-200/30 uppercase font-bold">Inflow</p>
              <p className="text-xs font-black text-amber-200">₹{stats.totalRecharged.toLocaleString()}</p>
           </div>
           <div className="bg-rose-500/5 p-3 rounded-xl border border-rose-500/10 text-center">
              <ArrowUpRight size={16} className="mx-auto text-rose-500 mb-1" />
              <p className="text-[9px] text-amber-200/30 uppercase font-bold">Outflow</p>
              <p className="text-xs font-black text-amber-200">₹{stats.totalWithdrawn.toLocaleString()}</p>
           </div>
           <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
              <TrendingUp size={16} className="mx-auto text-amber-500 mb-1" />
              <p className="text-[9px] text-amber-200/30 uppercase font-bold">Uptime</p>
              <p className="text-xs font-black text-amber-200">99.9%</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setView('recharges')} className="bg-amber-600 rounded-2xl p-5 flex flex-col items-start justify-between shadow-lg shadow-amber-600/20 active:scale-95 transition-all relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 bg-white/10 p-8 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Recharge Queue</p>
          <div className="flex items-center justify-between w-full">
            <p className="text-3xl font-black text-white">{stats.pendingRecharges.length}</p>
            <ChevronRight size={20} className="text-white/50" />
          </div>
        </button>
        <button onClick={() => setView('withdrawals')} className="bg-[#2c1810] border border-amber-900/30 rounded-2xl p-5 flex flex-col items-start justify-between active:scale-95 transition-all group">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-200/40 mb-2">Withdrawal Queue</p>
          <div className="flex items-center justify-between w-full">
            <p className="text-3xl font-black text-amber-500">{stats.pendingWithdrawals.length}</p>
            <ChevronRight size={20} className="text-amber-200/20" />
          </div>
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-200/40 mb-4 flex items-center">
          <Activity size={12} className="mr-2" /> Recent System Activity
        </h4>
        <div className="space-y-3">
          {users.flatMap(u => u.transactions).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(tx => (
            <div key={tx.id} className="flex items-center justify-between text-[11px] border-b border-white/5 pb-2 last:border-0 last:pb-0">
               <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'success' ? 'bg-green-500' : tx.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                  <span className="text-amber-200/60 font-mono">{new Date(tx.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  <span className="font-bold uppercase text-white/80">{tx.type}</span>
               </div>
               <span className="font-mono text-amber-500">₹{tx.amount.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const RechargesView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">Pending Recharges ({stats.pendingRecharges.length})</h3>
      </div>
      {stats.pendingRecharges.length === 0 ? (
        <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-10 text-center">
           <CheckCircle2 size={40} className="mx-auto text-green-500/20 mb-3" />
           <p className="text-[10px] font-black uppercase tracking-widest text-amber-200/20">All Clear</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stats.pendingRecharges.map((tx: any) => (
            <div key={tx.id} className="bg-white/5 border border-white/10 p-5 rounded-3xl animate-bounce-in">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-sm text-white">{tx.user.username}</h4>
                    <p className="text-[10px] text-amber-200/30 font-mono">{tx.user.email}</p>
                  </div>
                  <p className="text-xl font-black text-amber-500">₹{tx.amount}</p>
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
                    className="flex-1 bg-green-500 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Approve
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const WithdrawalsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">Pending Withdrawals ({stats.pendingWithdrawals.length})</h3>
      </div>
      {stats.pendingWithdrawals.length === 0 ? (
        <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-10 text-center">
           <Clock size={40} className="mx-auto text-amber-500/20 mb-3" />
           <p className="text-[10px] font-black uppercase tracking-widest text-amber-200/20">Empty Queue</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stats.pendingWithdrawals.map((tx: any) => (
            <div key={tx.id} className="bg-[#2c1810] border border-amber-900/30 p-5 rounded-3xl animate-bounce-in">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-sm text-white">{tx.user.username}</h4>
                    <p className="text-[10px] text-amber-200/30 font-mono mb-2">{tx.user.email}</p>
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                        <p className="text-[9px] text-amber-200/30 uppercase font-black mb-1">Payment Info</p>
                        <p className="text-[11px] text-white font-mono leading-relaxed break-all">
                            {tx.withdrawalDetails || 'No details provided'}
                        </p>
                    </div>
                  </div>
                  <p className="text-xl font-black text-amber-500">₹{tx.amount}</p>
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
                    Approve
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const SettingsView = () => (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-3">
           <Settings size={20} className="text-amber-500" />
           <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">Gateway Configuration</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-amber-200/30 block mb-2 ml-1">UPI Receiver ID</label>
            <input 
              type="text" 
              defaultValue={settings.upiId}
              onBlur={(e) => onUpdateSettings({ ...settings, upiId: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:border-amber-500 outline-none transition-all text-white font-mono"
              placeholder="royalhub@upi"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-amber-200/30 block mb-2 ml-1">Static QR URL</label>
            <input 
              type="text" 
              defaultValue={settings.qrCodeUrl}
              onBlur={(e) => onUpdateSettings({ ...settings, qrCodeUrl: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:border-amber-500 outline-none transition-all text-white font-mono"
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-amber-200/30 block mb-2 ml-1">Referral Bonus (%)</label>
              <input 
                type="number" 
                defaultValue={settings.referralBonusPercentage}
                onBlur={(e) => onUpdateSettings({ ...settings, referralBonusPercentage: parseInt(e.target.value) })}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:border-amber-500 outline-none transition-all text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-amber-200/30 block mb-2 ml-1">Withdrawal Fee (%)</label>
              <input 
                type="number" 
                defaultValue={settings.withdrawalFeePercentage}
                onBlur={(e) => onUpdateSettings({ ...settings, withdrawalFeePercentage: parseInt(e.target.value) })}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:border-amber-500 outline-none transition-all text-white"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
           <AlertTriangle size={20} className="text-rose-500" />
           <h3 className="text-xs font-black uppercase tracking-widest text-rose-500">Security Actions</h3>
        </div>
        <button 
          onClick={() => { if(confirm('Factory reset will delete all users and data. Proceed?')) onUpdateSettings(settings); }} 
          className="w-full bg-rose-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-rose-500/20"
        >
          Perform Factory Reset
        </button>
      </div>
    </div>
  );

  const ProductsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">Asset Catalog ({products.length})</h3>
        <button 
            onClick={() => setShowAddProduct(true)}
            className="bg-amber-500 text-black p-2 rounded-xl active:scale-90 transition-all shadow-lg shadow-amber-500/30"
        >
            <Plus size={20} />
        </button>
      </div>

      <div className="space-y-3">
        {products.map(product => (
          <div key={product.id} className="bg-white/5 border border-white/10 p-4 rounded-3xl flex items-center justify-between group">
             <div className="flex items-center gap-4">
                <img src={product.image} className="w-12 h-12 rounded-2xl object-cover border border-white/10" alt="" />
                <div>
                   <h4 className="font-black text-sm text-white uppercase">{product.name}</h4>
                   <p className="text-[10px] text-amber-500 font-black tracking-widest">₹{product.price}</p>
                </div>
             </div>
             <button 
                onClick={() => onDeleteProduct(product.id)}
                className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-all active:scale-90"
             >
                <Trash2 size={18} />
             </button>
          </div>
        ))}
      </div>

      {showAddProduct && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] p-6 overflow-y-auto">
          <div className="max-w-md mx-auto space-y-6 animate-bounce-in pt-10">
            <div className="flex items-center justify-between">
               <h3 className="text-lg font-black uppercase tracking-tighter text-amber-500">Forge New Asset</h3>
               <button onClick={() => setShowAddProduct(false)} className="text-white/20"><X size={24} /></button>
            </div>
            
            <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-amber-200/30 mb-2 block">Identifier</label>
                  <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-amber-500" placeholder="e.g. ROYAL-X1" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-200/30 mb-2 block">Price (₹)</label>
                    <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-200/30 mb-2 block">Daily (₹)</label>
                    <input type="number" value={newProduct.dailyIncome} onChange={e => setNewProduct({...newProduct, dailyIncome: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-amber-500" />
                  </div>
               </div>
               <button 
                onClick={() => { onAddProduct(newProduct as Product); setShowAddProduct(false); }}
                className="w-full bg-amber-500 text-black py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-amber-500/20 active:scale-95 transition-all mt-4"
               >
                 Authorize Asset Launch
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex overflow-x-auto gap-2 no-scrollbar py-2 sticky top-0 bg-[#1a0f0a]/90 backdrop-blur-md z-30 -mx-4 px-4 border-b border-amber-900/10">
        {(['dashboard', 'users', 'recharges', 'withdrawals', 'products', 'settings'] as AdminView[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${
              view === tab ? 'bg-amber-500 text-[#1a0f0a] shadow-lg shadow-amber-500/20' : 'bg-white/5 text-amber-200/40 hover:bg-white/10'
            }`}
          >
            {tab === 'users' && <Users size={12} />}
            {tab === 'recharges' && <CreditCard size={12} />}
            {tab === 'withdrawals' && <ArrowUpRight size={12} />}
            {tab}
          </button>
        ))}
      </div>

      <div className="animate-bounce-in">
        {view === 'dashboard' && <DashboardView />}
        {view === 'recharges' && <RechargesView />}
        {view === 'withdrawals' && <WithdrawalsView />}
        {view === 'settings' && <SettingsView />}
        {view === 'products' && <ProductsView />}

        {view === 'users' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-200/20" size={20} />
              <input 
                type="text" 
                placeholder="Search Partners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-14 pr-4 text-sm focus:border-amber-500 outline-none transition-all text-white placeholder-amber-200/20"
              />
            </div>
            <div className="space-y-2">
              {filteredUsers.map(user => (
                <div key={user.id} className="bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-all cursor-pointer" onClick={() => { setEditingUser(user); setEditForm({ balance: user.balance.toString(), password: '' }); }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                       <span className="font-black text-amber-500">{user.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white uppercase">{user.username}</h4>
                      <p className="text-[10px] text-amber-200/30 font-mono tracking-tighter">{user.email}</p>
                      <p className="text-xs font-black text-amber-500 mt-1">₹{user.balance.toFixed(0)}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/10 group-hover:text-amber-500 transition-all" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-[#2c1810] border border-amber-900/30 rounded-[40px] p-8 w-full max-w-sm animate-bounce-in shadow-2xl relative">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-amber-500">Partner Vault</h3>
              <button onClick={() => setEditingUser(null)} className="text-white/20 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col items-center mb-4">
                 <div className="w-20 h-20 rounded-3xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40 mb-3">
                    <span className="text-3xl font-black text-amber-500">{editingUser.username.charAt(0).toUpperCase()}</span>
                 </div>
                 <h2 className="text-xl font-black text-white">{editingUser.username}</h2>
                 <p className="text-[10px] text-amber-200/40 font-mono">ID: {editingUser.id}</p>
              </div>

              <div className="space-y-4">
                <div className="bg-black/40 p-5 rounded-3xl border border-white/5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-amber-200/30 block mb-3 ml-1">Asset Balance (₹)</label>
                  <input 
                    type="number" 
                    value={editForm.balance}
                    onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
                    className="w-full bg-transparent border-b border-white/10 py-2 text-2xl font-black text-amber-400 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                
                <div className="bg-black/40 p-5 rounded-3xl border border-white/5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-amber-200/30 block mb-3 ml-1">Secure Passkey Override</label>
                  <input 
                    type="text" 
                    placeholder="Enter new passkey..."
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full bg-transparent border-b border-white/10 py-2 text-sm text-white placeholder-white/5 focus:border-amber-500 outline-none transition-all"
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
                className="w-full bg-amber-500 text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-amber-500/20 active:scale-95 transition-all"
              >
                Sync Vault Changes
              </button>
              
              <button 
                className="w-full bg-rose-500/10 text-rose-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all opacity-50 hover:opacity-100"
                onClick={() => { if(confirm('Suspend this partner account?')) setEditingUser(null); }}
              >
                Restrict Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
