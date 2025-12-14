
import React, { useState, useEffect, useRef } from 'react';
import { Product, User, AppSettings, Transaction } from '../types';
import { Plus, Trash2, Users, ShoppingBag, ArrowDownLeft, Settings, Check, X, QrCode, DollarSign, AlertCircle, Clock, ShieldAlert, Image, Building, Lock, AlertTriangle, Edit, RefreshCw, Copy, CheckCircle2 } from 'lucide-react';

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

type AdminView = 'dashboard' | 'users' | 'products' | 'recharges' | 'withdrawals' | 'orders' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps & { onRefresh?: () => void }> = ({ 
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
    onUpdateUser,
    onRefresh 
}) => {
  // Security Check
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      const timer = setTimeout(() => onNavigate('dashboard'), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, onNavigate]);

  if (!currentUser || currentUser.role !== 'admin') {
      return (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-6 text-center animate-fadeIn">
              <div className="bg-red-50 p-6 rounded-full mb-6 border-4 border-red-100">
                  <ShieldAlert size={64} className="text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <button onClick={() => onNavigate('dashboard')} className="px-6 py-2 bg-gray-900 text-white rounded-lg mt-4">Back to Dashboard</button>
          </div>
      );
  }

  const [view, setView] = useState<AdminView>('dashboard');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Forms State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: 'ROYAL-', price: 0, dailyIncome: 0, days: 365, description: '', purchaseLimit: 2, image: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [qrForm, setQrForm] = useState(settings);
  const [adminCreds, setAdminCreds] = useState({ email: currentUser.email, password: '', confirmPassword: '' });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ balance: '', password: '' });

  // Data Calculations
  const totalUsers = users.filter(u => u.role !== 'admin').length;
  const allOrders = users.flatMap(u => u.investments.map(inv => ({
      ...inv, username: u.username,
      productName: inv.productSnapshot?.name || products.find(p => p.id === inv.productId)?.name || 'Deleted',
      dailyIncome: inv.productSnapshot?.dailyIncome || 0,
      price: inv.productSnapshot?.price || 0
  })));
  const totalInvested = allOrders.reduce((sum, order) => sum + (order.price || 0), 0);
  const totalPendingWithdrawals = users.reduce((acc, u) => acc + u.transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending').length, 0);
  const totalPendingRecharges = users.reduce((acc, u) => acc + u.transactions.filter(t => t.type === 'recharge' && t.status === 'pending').length, 0);

  const getAllTransactions = (type: Transaction['type']) => {
      return users.flatMap(u => u.transactions.map(t => ({...t, username: u.username, userId: u.id, currentBalance: u.balance})))
                  .filter(t => t.type === type)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    const finalImage = newProduct.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24';
    onAddProduct({
      id: Date.now().toString(),
      name: newProduct.name!,
      price: Number(newProduct.price),
      dailyIncome: Number(newProduct.dailyIncome),
      days: Number(newProduct.days),
      description: newProduct.description || '',
      image: finalImage,
      purchaseLimit: Number(newProduct.purchaseLimit) || 2,
      totalRevenue: Number(newProduct.dailyIncome) * Number(newProduct.days)
    });
    setNewProduct({ name: 'ROYAL-', price: 0, dailyIncome: 0, days: 365, purchaseLimit: 2, image: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { alert('Image too large (Max 1MB)'); return; }
      const reader = new FileReader();
      reader.onloadend = () => setNewProduct({ ...newProduct, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { alert('Image too large (Max 1MB)'); return; }
      const reader = new FileReader();
      reader.onloadend = () => setQrForm(prev => ({ ...prev, qrCodeUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSaveUser = () => {
      if (!editingUser) return;
      const updates: Partial<User> = {};
      if (editForm.balance !== '') updates.balance = parseFloat(editForm.balance);
      if (editForm.password.trim() !== '') updates.password = editForm.password;
      if (Object.keys(updates).length > 0 && window.confirm("Save changes to user?")) {
          onUpdateUser(editingUser.id, updates);
      }
      setEditingUser(null);
  };

  const copyToClipboard = (text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  // --- Sub-Components (Condensed) ---
  const DashboardView = () => (
      <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                <p className="text-xs text-gray-500 uppercase">Users</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                <p className="text-xs text-gray-500 uppercase">Invested</p>
                <p className="text-2xl font-bold">₹{totalInvested.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-amber-500">
                <p className="text-xs text-gray-500 uppercase">Pending Recharge</p>
                <p className="text-2xl font-bold">{totalPendingRecharges}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
                <p className="text-xs text-gray-500 uppercase">Pending W/D</p>
                <p className="text-2xl font-bold">{totalPendingWithdrawals}</p>
            </div>
          </div>
          
          {/* Environment Warning */}
          {(typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) && (
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-xs text-yellow-800 flex items-center">
                  <AlertTriangle size={16} className="mr-2" />
                  <span><strong>Dev Mode:</strong> Connected to Local Backend. Data will persist in MongoDB.</span>
              </div>
          )}
      </div>
  );

  return (
    <div className="pb-20">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-[#2c1810]">Admin Panel</h1>
            <button 
                onClick={() => window.location.reload()} 
                className="bg-gray-200 p-2 rounded-full hover:bg-gray-300 transition-colors"
                title="Force Refresh Data"
            >
                <RefreshCw size={18} />
            </button>
        </div>

        <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar mb-4">
            {['dashboard','users','orders','products','recharges','withdrawals','settings'].map(v => (
                <button key={v} onClick={() => setView(v as AdminView)} 
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap capitalize ${view === v ? 'bg-[#2c1810] text-white' : 'bg-white text-gray-600'}`}>
                    {v}
                </button>
            ))}
        </div>

        {view === 'dashboard' && <DashboardView />}
        
        {view === 'users' && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-xs border-b">
                        <tr><th className="px-4 py-3">User</th><th className="px-4 py-3 text-right">Balance</th><th className="px-4 py-3">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.filter(u => u.role !== 'admin').map(u => (
                            <tr key={u.id}>
                                <td className="px-4 py-3">
                                    <div className="font-bold">{u.username}</div>
                                    <div className="text-xs text-gray-400">{u.email}</div>
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-amber-600">₹{u.balance.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => { setEditingUser(u); setEditForm({balance: u.balance.toString(), password: ''}); }} className="bg-gray-100 px-3 py-1.5 rounded text-xs font-bold">Manage</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {view === 'products' && (
            <div className="space-y-4">
                 <div className="bg-white p-4 rounded-lg shadow-sm border border-amber-200">
                    <h3 className="font-bold mb-2 text-sm">Add Product</h3>
                    <form onSubmit={handleProductSubmit} className="space-y-3">
                        <input className="w-full p-2 border rounded text-xs" placeholder="Name" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name: e.target.value})} />
                        <div className="grid grid-cols-2 gap-2">
                            <input className="p-2 border rounded text-xs" type="number" placeholder="Price" value={newProduct.price||''} onChange={e=>setNewProduct({...newProduct, price: Number(e.target.value)})} />
                            <input className="p-2 border rounded text-xs" type="number" placeholder="Daily Inc" value={newProduct.dailyIncome||''} onChange={e=>setNewProduct({...newProduct, dailyIncome: Number(e.target.value)})} />
                        </div>
                         <div className="grid grid-cols-2 gap-2">
                            <input className="p-2 border rounded text-xs" type="number" placeholder="Days" value={newProduct.days||''} onChange={e=>setNewProduct({...newProduct, days: Number(e.target.value)})} />
                            <input className="p-2 border rounded text-xs" type="file" ref={fileInputRef} onChange={handleImageUpload} />
                        </div>
                        <button className="w-full bg-amber-600 text-white py-2 rounded text-xs font-bold">Add</button>
                    </form>
                 </div>
                 {products.map(p => (
                     <div key={p.id} className="bg-white p-3 rounded shadow-sm flex justify-between items-center">
                         <div className="flex gap-2">
                             <img src={p.image} className="w-10 h-10 rounded bg-gray-200 object-cover" />
                             <div><p className="font-bold text-xs">{p.name}</p><p className="text-[10px] text-gray-500">₹{p.price}</p></div>
                         </div>
                         <button onClick={() => onDeleteProduct(p.id)}><Trash2 size={16} className="text-gray-400 hover:text-red-500"/></button>
                     </div>
                 ))}
            </div>
        )}
        
        {view === 'recharges' && (
            <div className="space-y-2">
                {getAllTransactions('recharge').filter(t => t.status === 'pending').map(tx => (
                    <div key={tx.id} className="bg-white p-3 rounded shadow-sm border-l-4 border-amber-500">
                        <div className="flex justify-between">
                            <span className="font-bold text-sm">{tx.username}</span>
                            <span className="font-bold text-green-600">+₹{tx.amount}</span>
                        </div>
                         <div className="text-xs text-gray-400 mb-2">Current Bal: ₹{tx.currentBalance.toFixed(2)}</div>
                        <div className="flex gap-2 mt-2">
                            <button onClick={()=>onApproveRecharge(tx.userId!, tx.id)} className="flex-1 bg-green-600 text-white py-1 rounded text-xs">Approve</button>
                            <button onClick={()=>onRejectRecharge(tx.userId!, tx.id)} className="flex-1 bg-red-100 text-red-600 py-1 rounded text-xs">Reject</button>
                        </div>
                    </div>
                ))}
                {getAllTransactions('recharge').filter(t => t.status === 'pending').length === 0 && <p className="text-center text-xs text-gray-400">No pending recharges</p>}
            </div>
        )}
        
        {view === 'withdrawals' && (
             <div className="space-y-2">
                {getAllTransactions('withdrawal').filter(t => t.status === 'pending').map(tx => {
                    // ROBUST PARSING LOGIC
                    let detailsObj: any = {};
                    const raw = tx.withdrawalDetails;
                    
                    try {
                        if (typeof raw === 'string') {
                            // Attempt to parse JSON string
                            if (raw.trim().startsWith('{')) {
                                detailsObj = JSON.parse(raw);
                            } else {
                                // Fallback for plain text legacy data
                                detailsObj = { details: raw };
                            }
                        } else if (typeof raw === 'object' && raw !== null) {
                             // Handle case where Mongoose might return mixed/object
                            detailsObj = raw;
                        } else {
                             detailsObj = { details: 'No details available' };
                        }
                    } catch (e) {
                        detailsObj = { details: String(raw) };
                    }

                    // Determine display values
                    const displayMethod = detailsObj.method || 'bank'; 
                    // Use 'details' first, then 'info', then fall back to raw stringified if needed
                    const displayDetails = detailsObj.details || detailsObj.info || (typeof raw === 'string' ? raw : JSON.stringify(raw));
                    
                    // Improved UPI detection
                    const isUpi = displayMethod === 'upi' || 
                                 (typeof displayDetails === 'string' && displayDetails.includes('@') && !displayDetails.includes('IFSC'));
                    
                    return (
                    <div key={tx.id} className="bg-white p-3 rounded shadow-sm border-l-4 border-red-500">
                         <div className="flex justify-between mb-1">
                            <div>
                                <h4 className="font-bold text-base text-gray-900">{tx.username}</h4>
                                <p className="text-[10px] text-gray-400">Req: {new Date(tx.date).toLocaleString()}</p>
                                <p className="text-[10px] text-gray-500">Current Balance: ₹{tx.currentBalance.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-xl text-amber-600">₹{tx.amount}</span>
                                <span className="bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded font-bold">PENDING REVIEW</span>
                            </div>
                        </div>

                        {/* Enhanced Payment Details Section */}
                        <div className="bg-blue-50 p-3 rounded-md mt-2 mb-3 border border-blue-100 relative group">
                            <div className="flex items-center text-blue-800 font-bold text-xs mb-1">
                                {isUpi ? <QrCode size={12} className="mr-1"/> : <Building size={12} className="mr-1"/>}
                                {isUpi ? 'UPI TRANSFER' : 'BANK TRANSFER'}
                            </div>
                            {/* whitespace-pre-wrap ensures newlines in bank details are preserved */}
                            <div className="bg-white border border-blue-200 p-2 rounded text-sm font-mono text-gray-700 break-all pr-8 whitespace-pre-wrap">
                                {displayDetails || <span className="text-red-400 italic font-bold">MISSING DATA</span>}
                            </div>
                            
                            {/* Copy Button */}
                            {displayDetails && (
                                <button 
                                    onClick={() => copyToClipboard(displayDetails, tx.id)}
                                    className="absolute bottom-3 right-3 text-blue-400 hover:text-blue-600 transition-colors bg-white p-1 rounded border border-blue-100 shadow-sm"
                                    title="Copy Details"
                                >
                                    {copiedId === tx.id ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={()=>onApproveWithdrawal(tx.userId!, tx.id)} 
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold text-sm shadow-sm flex items-center justify-center transition-colors"
                            >
                                <Check size={16} className="mr-1" /> Approve & Paid
                            </button>
                            <button 
                                onClick={()=>onRejectWithdrawal(tx.userId!, tx.id)} 
                                className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded font-bold text-sm shadow-sm flex items-center justify-center transition-colors border border-red-200"
                            >
                                <X size={16} className="mr-1" /> Reject & Refund
                            </button>
                        </div>
                    </div>
                )})}
                 {getAllTransactions('withdrawal').filter(t => t.status === 'pending').length === 0 && <p className="text-center text-xs text-gray-400">No pending withdrawals</p>}
                 
                 {/* Withdrawal History (Condensed) */}
                 <div className="mt-8 pt-4 border-t border-gray-200">
                    <h4 className="font-bold text-sm text-gray-700 mb-3 flex items-center"><Clock size={16} className="mr-1"/> History</h4>
                    <div className="space-y-2 opacity-75">
                         {getAllTransactions('withdrawal').filter(t => t.status !== 'pending').slice(0, 5).map(tx => (
                            <div key={tx.id} className="bg-gray-50 p-2 rounded flex justify-between items-center text-xs">
                                <div>
                                    <div className="font-bold">{tx.username}</div>
                                    <div className="text-gray-400">{new Date(tx.date).toLocaleDateString()}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">₹{tx.amount}</div>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${tx.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{tx.status.toUpperCase()}</span>
                                </div>
                            </div>
                         ))}
                    </div>
                 </div>
            </div>
        )}

        {view === 'settings' && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <form onSubmit={(e) => { e.preventDefault(); if(window.confirm("Save?")) onUpdateSettings(qrForm); }}>
                    <label className="text-xs font-bold block mb-1">UPI ID</label>
                    <input className="w-full p-2 border rounded mb-2 text-xs" value={qrForm.upiId} onChange={e=>setQrForm({...qrForm, upiId:e.target.value})} />
                    <label className="text-xs font-bold block mb-1">Upload Static QR</label>
                    <input type="file" className="w-full mb-4 text-xs" onChange={handleQrUpload} />
                    <button className="w-full bg-blue-600 text-white py-2 rounded text-xs font-bold">Save Settings</button>
                </form>
            </div>
        )}

        {editingUser && (
             <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                 <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                     <h3 className="font-bold mb-4">Manage {editingUser.username}</h3>
                     <input type="number" className="w-full border p-2 mb-2 rounded" value={editForm.balance} onChange={e=>setEditForm({...editForm, balance: e.target.value})} placeholder="New Balance" />
                     <div className="flex gap-2 mt-4">
                         <button onClick={()=>setEditingUser(null)} className="flex-1 py-2 bg-gray-200 rounded">Cancel</button>
                         <button onClick={handleSaveUser} className="flex-1 py-2 bg-green-600 text-white rounded">Save</button>
                     </div>
                 </div>
             </div>
        )}
    </div>
  );
};
