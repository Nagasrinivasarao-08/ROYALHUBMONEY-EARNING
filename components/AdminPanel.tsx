import React, { useState, useEffect, useRef } from 'react';
import { Product, User, AppSettings, Transaction } from '../types';
import { Plus, Trash2, Users, ShoppingBag, ArrowDownLeft, Settings, Check, X, QrCode, DollarSign, AlertCircle, Clock, ShieldAlert, Image, Building, Lock, AlertTriangle, Edit, RefreshCw, Copy, CheckCircle2, Search, UserX, Link, Activity, Database, Server } from 'lucide-react';
import { api } from '../services/api';

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

type AdminView = 'dashboard' | 'users' | 'orders' | 'products' | 'recharges' | 'withdrawals' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
    currentUser,
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
    onNavigate,
    onUpdateAdminCredentials,
    onResetData,
    onUpdateUser
}) => {
  const [view, setView] = useState<AdminView>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ balance: '', password: '' });
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: 'ROYAL-', price: 0, dailyIncome: 0, days: 365, description: '', purchaseLimit: 2, image: ''
  });

  const totalUsers = users.filter(u => u.role !== 'admin').length;
  const totalBalance = users.reduce((acc, u) => acc + u.balance, 0);
  const pendingWithdrawals = users.flatMap(u => u.transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending'));
  const pendingRecharges = users.flatMap(u => u.transactions.filter(t => t.type === 'recharge' && t.status === 'pending'));

  const filteredUsers = users.filter(u => 
    u.role !== 'admin' && 
    (u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const DashboardView = () => (
    <div className="space-y-4">
      {/* Real-time Monitor */}
      <div className="bg-[#2c1810] border border-amber-900/30 rounded-2xl p-4 overflow-hidden relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-amber-500 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">Live Infrastructure</h3>
          </div>
          <span className="text-[10px] font-mono text-green-500 bg-green-500/10 px-2 py-0.5 rounded">ONLINE</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
            <Database size={16} className="text-amber-200/50 mb-1" />
            <p className="text-[10px] text-amber-200/30 uppercase font-bold">Latency</p>
            <p className="text-sm font-black text-amber-200">24ms</p>
          </div>
          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
            <Server size={16} className="text-amber-200/50 mb-1" />
            <p className="text-[10px] text-amber-200/30 uppercase font-bold">Requests</p>
            <p className="text-sm font-black text-amber-200">1.2k/m</p>
          </div>
          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
            <Activity size={16} className="text-amber-200/50 mb-1" />
            <p className="text-[10px] text-amber-200/30 uppercase font-bold">Uptime</p>
            <p className="text-sm font-black text-amber-200">99.9%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-200/40 mb-1">Total Users</p>
          <p className="text-2xl font-black">{totalUsers}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-200/40 mb-1">Liability</p>
          <p className="text-2xl font-black text-amber-500">₹{totalBalance.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-amber-600 rounded-2xl p-5 flex items-center justify-between shadow-lg shadow-amber-600/20">
        <div>
          <h4 className="text-sm font-black uppercase tracking-widest text-white/70">Recharge Queue</h4>
          <p className="text-3xl font-black text-white">{pendingRecharges.length}</p>
        </div>
        <button 
          onClick={() => setView('recharges')}
          className="bg-white text-amber-600 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
        >
          View All
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex overflow-x-auto gap-2 no-scrollbar py-2">
        {['dashboard', 'users', 'recharges', 'withdrawals', 'products', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab as AdminView)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              view === tab ? 'bg-amber-500 text-[#1a0f0a]' : 'bg-white/5 text-amber-200/40 hover:bg-white/10'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {view === 'dashboard' && <DashboardView />}

      {view === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-200/20" size={18} />
            <input 
              type="text" 
              placeholder="Filter users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-amber-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group">
                <div>
                  <h4 className="font-bold text-sm">{user.username}</h4>
                  <p className="text-[10px] text-amber-200/30 font-mono">{user.email}</p>
                  <p className="text-xs font-black text-amber-500 mt-1">₹{user.balance.toFixed(2)}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingUser(user); setEditForm({ balance: user.balance.toString(), password: '' }); }}
                    className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"
                  >
                    <Edit size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forms for Add Product and User Management would go here, optimized with the new luxury theme */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-[#2c1810] border border-amber-900/30 rounded-3xl p-6 w-full max-w-sm animate-bounce-in shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">Edit Partner</h3>
              <button onClick={() => setEditingUser(null)} className="text-amber-200/30"><X size={20} /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-amber-200/30 block mb-1.5 ml-1">New Balance (₹)</label>
                <input 
                  type="number" 
                  value={editForm.balance}
                  onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm focus:border-amber-500 outline-none"
                />
              </div>
              <button 
                onClick={() => {
                  onUpdateUser(editingUser.id, { balance: parseFloat(editForm.balance) });
                  setEditingUser(null);
                }}
                className="w-full bg-amber-500 text-[#1a0f0a] py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-transform"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};