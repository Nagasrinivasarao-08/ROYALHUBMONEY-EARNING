import React, { useState, useEffect } from 'react';
import { Product, User, AppSettings, Transaction } from '../types';
import { Plus, Trash2, Users, ShoppingBag, ArrowDownLeft, Settings, Check, X, QrCode, DollarSign, AlertCircle, Clock, ShieldAlert, Image, Building, Lock, AlertTriangle, Edit } from 'lucide-react';

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
  // Security Check with Auto-Redirect
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      const timer = setTimeout(() => {
        onNavigate('dashboard');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, onNavigate]);

  // Render Access Denied View for Non-Admins
  if (!currentUser || currentUser.role !== 'admin') {
      return (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-6 text-center animate-fadeIn">
              <div className="bg-red-50 p-6 rounded-full mb-6 border-4 border-red-100">
                  <ShieldAlert size={64} className="text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">
                  You do not have administrative privileges to view this dashboard.
                  <br/>
                  <span className="text-xs font-semibold text-gray-400 mt-2 block">Redirecting to dashboard in 3 seconds...</span>
              </p>
              <button 
                  onClick={() => onNavigate('dashboard')}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-md font-bold text-sm"
              >
                  Back to Dashboard Now
              </button>
          </div>
      );
  }

  const [view, setView] = useState<AdminView>('dashboard');
  
  // New Product Form State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: 'ROYAL-',
    price: 0,
    dailyIncome: 0,
    days: 365,
    description: '',
    purchaseLimit: 2,
    image: '' // Start empty to show placeholder
  });

  // Settings Form State
  const [qrForm, setQrForm] = useState(settings);
  
  // Admin Creds Form State
  const [adminCreds, setAdminCreds] = useState({
      email: currentUser.email,
      password: '',
      confirmPassword: ''
  });

  // User Management Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ balance: '', password: '' });

  // Derived Data
  const totalUsers = users.filter(u => u.role !== 'admin').length;
  
  const allOrders = users.flatMap(u => u.investments.map(inv => {
      const product = inv.productSnapshot || products.find(p => p.id === inv.productId);
      return {
          ...inv,
          username: u.username,
          productName: product?.name || 'Unknown (Deleted)',
          dailyIncome: product?.dailyIncome || 0,
          price: product?.price || 0,
          days: product?.days || 0
      };
  }));

  const totalInvested = allOrders.reduce((sum, order) => sum + order.price, 0);
  const totalPendingWithdrawals = users.reduce((acc, u) => acc + u.transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending').length, 0);
  const totalPendingRecharges = users.reduce((acc, u) => acc + u.transactions.filter(t => t.type === 'recharge' && t.status === 'pending').length, 0);

  // Helper to get all transactions flattened
  const getAllTransactions = (type: Transaction['type']) => {
      return users.flatMap(u => u.transactions.map(t => ({...t, username: u.username, userId: u.id, currentBalance: u.balance})))
                  .filter(t => t.type === type)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    
    // Use uploaded image or fallback to a default if empty
    const finalImage = newProduct.image || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&auto=format&fit=crop';

    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name!,
      price: Number(newProduct.price),
      dailyIncome: Number(newProduct.dailyIncome),
      days: Number(newProduct.days),
      description: newProduct.description || 'New investment opportunity',
      image: finalImage,
      purchaseLimit: Number(newProduct.purchaseLimit) || 2,
      totalRevenue: Number(newProduct.dailyIncome) * Number(newProduct.days)
    };
    onAddProduct(product);
    setNewProduct({ name: 'ROYAL-', price: 0, dailyIncome: 0, days: 365, purchaseLimit: 2, description: '', image: '' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
          // Use callback if provided in props later, for now simple alert/toast handled by caller
          // Since we inside AdminPanel, we can't easily trigger App toast directly without prop drilling
          // But we replaced standard alerts with callbacks in previous step.
          // For file validation we will stick to native alert or just return.
          alert('Image size exceeds 1MB limit. Please choose a smaller image to ensure app performance.');
          return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
          alert('Image size exceeds 1MB limit. Please choose a smaller image.');
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrForm(prev => ({ ...prev, qrCodeUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (window.confirm("Are you sure you want to save these system settings?")) {
        onUpdateSettings(qrForm);
      }
  };

  const handleAdminCredsSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (adminCreds.password && adminCreds.password !== adminCreds.confirmPassword) {
          alert('Passwords do not match');
          return;
      }
      if (!adminCreds.email) {
          alert('Email cannot be empty');
          return;
      }
      
      onUpdateAdminCredentials(adminCreds.email, adminCreds.password || currentUser.password);
      setAdminCreds(prev => ({ ...prev, password: '', confirmPassword: '' }));
  };

  const confirmReset = () => {
      if(window.confirm("CRITICAL WARNING: This will delete ALL users, orders, and transactions. The system will be reset to factory defaults. Are you sure?")) {
          onResetData();
      }
  }

  // Handle opening user edit modal
  const openEditUser = (user: User) => {
      setEditingUser(user);
      setEditForm({ balance: user.balance.toString(), password: '' });
  };

  // Handle saving user changes
  const handleSaveUser = () => {
      if (!editingUser) return;
      
      const updates: Partial<User> = {};
      
      if (editForm.balance !== '') {
          const newBalance = parseFloat(editForm.balance);
          if (!isNaN(newBalance)) {
              updates.balance = newBalance;
          }
      }

      if (editForm.password.trim() !== '') {
          updates.password = editForm.password;
      }

      if (Object.keys(updates).length > 0) {
          onUpdateUser(editingUser.id, updates);
      }
      setEditingUser(null);
  };

  const handleDeleteUser = () => {
      // In a real app we'd likely deactivate. Here, deletion is complex due to refs. 
      // For now, let's just alert functionality limit or implement later.
      alert("User deletion is restricted to prevent data corruption. You can change their password to lock them out.");
  };

  // --- Sub-Components for Views ---

  const DashboardView = () => (
      <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setView('users')} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 text-left hover:bg-blue-50 transition-colors">
                <p className="text-xs text-gray-500 uppercase flex items-center"><Users size={14} className="mr-1"/> Total Users</p>
                <p className="text-2xl font-bold text-gray-800">{totalUsers}</p>
            </button>
            <button onClick={() => setView('orders')} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500 text-left hover:bg-green-50 transition-colors">
                <p className="text-xs text-gray-500 uppercase flex items-center"><DollarSign size={14} className="mr-1"/> Total Invested</p>
                <p className="text-2xl font-bold text-gray-800">₹{totalInvested.toLocaleString()}</p>
            </button>
            <button onClick={() => setView('recharges')} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-amber-500 text-left hover:bg-amber-50 transition-colors">
                <p className="text-xs text-gray-500 uppercase flex items-center"><ArrowDownLeft size={14} className="mr-1"/> Pending Recharge</p>
                <p className="text-2xl font-bold text-gray-800">{totalPendingRecharges}</p>
            </button>
            <button onClick={() => setView('withdrawals')} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500 text-left hover:bg-red-50 transition-colors">
                <p className="text-xs text-gray-500 uppercase flex items-center"><AlertCircle size={14} className="mr-1"/> Pending W/D</p>
                <p className="text-2xl font-bold text-gray-800">{totalPendingWithdrawals}</p>
            </button>
          </div>
          
          <div className="bg-[#2c1810] text-white p-6 rounded-xl mt-6">
              <h3 className="text-lg font-bold mb-2">Admin Control Center</h3>
              <p className="text-sm opacity-80">Welcome back, {currentUser.username}. Use the navigation tabs above to manage users, products, orders, and financial requests.</p>
          </div>
      </div>
  );

  const UsersView = () => (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          <div className="p-3 border-b border-gray-100 bg-gray-50 font-bold text-xs uppercase text-gray-500 flex justify-between items-center">
              <span>Registered Users</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px]">{users.filter(u => u.role !== 'admin').length}</span>
          </div>
          <table className="w-full text-sm text-left">
              <thead className="bg-white text-gray-500 text-xs border-b border-gray-100">
                  <tr>
                      <th className="px-4 py-3 font-medium">User Details</th>
                      <th className="px-4 py-3 font-medium text-right">Balance</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                  {users.filter(u => u.role !== 'admin').map(u => (
                      <tr key={u.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="px-4 py-3">
                              <div className="font-bold text-gray-800">{u.username}</div>
                              <div className="text-xs text-gray-400">{u.email}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">Ref: {u.referralCode}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-amber-600">₹{u.balance.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                              <button 
                                onClick={() => openEditUser(u)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center ml-auto"
                              >
                                  <Edit size={12} className="mr-1"/> Manage
                              </button>
                          </td>
                      </tr>
                  ))}
                  {users.filter(u => u.role !== 'admin').length === 0 && (
                      <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-xs">No users registered yet.</td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>
  );

  const OrdersView = () => (
      <div className="space-y-4">
          {allOrders.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
                  <ShoppingBag size={48} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400 text-sm">No investment orders found.</p>
              </div>
          ) : (
              allOrders.sort((a,b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()).map(order => {
                  const endDate = new Date(new Date(order.purchaseDate).getTime() + order.days * 24 * 60 * 60 * 1000);
                  const isExpired = new Date() > endDate;
                  
                  return (
                      <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isExpired ? 'bg-gray-100 text-gray-400' : 'bg-amber-100 text-amber-600'}`}>
                                      <ShoppingBag size={20} />
                                  </div>
                                  <div>
                                      <p className="font-bold text-gray-800">{order.productName}</p>
                                      <p className="text-xs text-gray-500">User: <span className="font-semibold text-amber-700">{order.username}</span></p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-gray-800">₹{order.price}</p>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                                      isExpired ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                                  }`}>
                                      {isExpired ? 'Expired' : 'Active'}
                                  </span>
                              </div>
                          </div>
                          <div className="pt-2 mt-1 border-t border-gray-50 flex justify-between text-xs text-gray-500">
                              <span>Bought: {new Date(order.purchaseDate).toLocaleDateString()}</span>
                              <span>Returns: ₹{order.dailyIncome}/day</span>
                          </div>
                      </div>
                  );
              })
          )}
      </div>
  );

  const RechargesView = () => {
      const recharges = getAllTransactions('recharge');
      const pending = recharges.filter(t => t.status === 'pending');
      const history = recharges.filter(t => t.status !== 'pending');

      return (
        <div className="space-y-6">
            {/* Pending Recharges */}
             <div>
                <h3 className="text-sm font-bold text-[#2c1810] mb-3 flex items-center">
                    <AlertCircle size={16} className="mr-2 text-amber-600" /> Pending Recharges ({pending.length})
                </h3>
                {pending.length === 0 ? (
                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-400 text-sm">
                        No pending recharges.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pending.map(tx => (
                            <div key={tx.id} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-amber-500 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-lg text-gray-800">{tx.username}</p>
                                        <p className="text-xs text-gray-500">Req: {new Date(tx.date).toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 mt-1">Current Balance: <span className="font-semibold text-gray-700">₹{tx.currentBalance?.toFixed(2)}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-2xl text-green-600">+₹{tx.amount}</p>
                                        <span className="text-[10px] uppercase font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Pending Approval</span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 pt-3 border-t border-gray-100">
                                    <button 
                                        onClick={() => onApproveRecharge(tx.userId!, tx.id)}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-bold text-sm flex items-center justify-center transition-colors"
                                    >
                                        <Check size={16} className="mr-2" /> Approve
                                    </button>
                                    <button 
                                        onClick={() => onRejectRecharge(tx.userId!, tx.id)}
                                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-md font-bold text-sm flex items-center justify-center transition-colors"
                                    >
                                        <X size={16} className="mr-2" /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* History */}
             <div>
                <h3 className="text-sm font-bold text-[#2c1810] mb-3 flex items-center pt-4 border-t border-gray-200">
                    <Clock size={16} className="mr-2 text-gray-400" /> Recharge History
                </h3>
                {history.length === 0 ? (
                    <div className="text-center p-8 bg-white rounded-lg text-gray-400 text-sm border border-gray-100">No recharge history.</div>
                ) : (
                    history.map(tx => (
                        <div key={tx.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                    <ArrowDownLeft size={16} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{tx.username}</p>
                                    <p className="text-[10px] text-gray-400">{new Date(tx.date).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-green-600">+₹{tx.amount}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                                    tx.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>{tx.status}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      );
  };

  const WithdrawalsView = () => {
      const withdrawals = getAllTransactions('withdrawal');
      const pending = withdrawals.filter(t => t.status === 'pending');
      const history = withdrawals.filter(t => t.status !== 'pending');

      return (
        <div className="space-y-6">
            {/* Pending Requests Section */}
            <div>
                <h3 className="text-sm font-bold text-[#2c1810] mb-3 flex items-center">
                    <AlertCircle size={16} className="mr-2 text-amber-600" /> Pending Withdrawals ({pending.length})
                </h3>
                {pending.length === 0 ? (
                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-400 text-sm">
                        No pending withdrawal requests.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pending.map(tx => (
                            <div key={tx.id} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-amber-500 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-lg text-gray-800">{tx.username}</p>
                                        <p className="text-xs text-gray-500">Req: {new Date(tx.date).toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 mt-1">Current Balance: <span className="font-semibold text-gray-700">₹{tx.currentBalance?.toFixed(2)}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-2xl text-amber-600">₹{tx.amount}</p>
                                        <span className="text-[10px] uppercase font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Pending Review</span>
                                    </div>
                                </div>

                                {/* Bank Details Box */}
                                {tx.withdrawalDetails && (
                                    <div className="bg-blue-50 p-3 rounded-md text-sm border border-blue-100">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-blue-800 uppercase flex items-center">
                                                 {tx.withdrawalDetails.method === 'upi' ? <QrCode size={10} className="mr-1"/> : <Building size={10} className="mr-1"/>}
                                                 {tx.withdrawalDetails.method === 'upi' ? 'UPI Transfer' : 'Bank Transfer'}
                                            </span>
                                        </div>
                                        <div className="bg-white p-2 rounded border border-blue-200">
                                            <p className="text-gray-800 font-mono text-xs break-all select-all">{tx.withdrawalDetails.details}</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex gap-3 pt-3 border-t border-gray-100">
                                    <button 
                                        onClick={() => onApproveWithdrawal(tx.userId!, tx.id)}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-bold text-sm flex items-center justify-center transition-colors"
                                    >
                                        <Check size={16} className="mr-2" /> Approve & Paid
                                    </button>
                                    <button 
                                        onClick={() => onRejectWithdrawal(tx.userId!, tx.id)}
                                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-md font-bold text-sm flex items-center justify-center transition-colors"
                                    >
                                        <X size={16} className="mr-2" /> Reject & Refund
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* History Section */}
            <div>
                 <h3 className="text-sm font-bold text-[#2c1810] mb-3 flex items-center pt-4 border-t border-gray-200">
                    <Clock size={16} className="mr-2 text-gray-400" /> History
                </h3>
                <div className="space-y-2 opacity-80">
                    {history.map(tx => (
                        <div key={tx.id} className="bg-white p-3 rounded-lg border border-gray-100 flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-sm text-gray-700">{tx.username}</p>
                                <p className="text-[10px] text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-sm text-gray-600">₹{tx.amount}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                                    tx.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {tx.status}
                                </span>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && <p className="text-center text-xs text-gray-400">No history available.</p>}
                </div>
            </div>
        </div>
      );
  };

  const ProductsView = () => (
      <div className="space-y-8">
        {/* Add Product Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-200">
            <h2 className="text-sm font-bold mb-4 text-[#2c1810] flex items-center border-b border-amber-100 pb-2">
                <Plus size={16} className="mr-2 text-amber-600" /> Create Product
            </h2>
            <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Product Name</label>
                    <input type="text" placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full p-2 border rounded text-xs" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Price (₹)</label>
                        <input type="number" placeholder="Price" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full p-2 border rounded text-xs" required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Daily Income (₹)</label>
                        <input type="number" placeholder="Daily Income" value={newProduct.dailyIncome || ''} onChange={e => setNewProduct({...newProduct, dailyIncome: Number(e.target.value)})} className="w-full p-2 border rounded text-xs" required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Cycle (Days)</label>
                        <input type="number" placeholder="Days" value={newProduct.days || ''} onChange={e => setNewProduct({...newProduct, days: Number(e.target.value)})} className="w-full p-2 border rounded text-xs" required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Purchase Limit</label>
                        <input type="number" placeholder="Limit (Default: 2)" value={newProduct.purchaseLimit || ''} onChange={e => setNewProduct({...newProduct, purchaseLimit: Number(e.target.value)})} className="w-full p-2 border rounded text-xs" required />
                    </div>
                </div>
                
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Product Image</label>
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                             {newProduct.image ? (
                                 <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" />
                             ) : (
                                 <div className="flex flex-col items-center text-gray-400">
                                    <Image size={20} />
                                    <span className="text-[10px] mt-1 font-medium">No Image</span>
                                 </div>
                             )}
                        </div>
                        <div className="flex-1">
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" 
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Upload JPEG/PNG (Max 1MB recommended)</p>
                        </div>
                    </div>
                </div>
                
                <button type="submit" className="w-full bg-amber-600 text-white py-2 rounded text-sm font-bold hover:bg-amber-700 transition-colors">Add Product</button>
            </form>
        </div>

        {/* List Products */}
        <div className="space-y-2">
            <h3 className="text-sm font-bold text-gray-700 mb-2 px-1">Active Products ({products.length})</h3>
            {products.map(p => (
                <div key={p.id} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center border border-gray-100">
                    <div className="flex items-center gap-3">
                        <img src={p.image} className="w-12 h-12 rounded object-cover bg-gray-200" alt="" />
                        <div>
                            <p className="font-bold text-sm text-[#2c1810]">{p.name}</p>
                            <div className="flex gap-2 text-[10px] text-gray-500 mt-1">
                                <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">₹{p.price}</span>
                                <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">Returns: ₹{p.dailyIncome}</span>
                                <span className="bg-gray-100 px-1.5 py-0.5 rounded">Limit: {p.purchaseLimit}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => onDeleteProduct(p.id)} className="text-gray-400 hover:text-red-500 p-2 transition-colors"><Trash2 size={18} /></button>
                </div>
            ))}
        </div>
      </div>
  );

  const SettingsView = () => (
      <div className="bg-white p-6 rounded-xl shadow-sm space-y-8">
          {/* General System Settings */}
          <div>
            <h2 className="text-lg font-bold mb-6 flex items-center">
                <Settings size={20} className="mr-2" /> System Settings
            </h2>
            <div className="bg-amber-50 p-4 rounded-lg mb-6 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Configuration Guide:</strong><br/>
                1. <strong>UPI ID:</strong> Enter your UPI ID to enable <strong>Dynamic QR Codes</strong> (Amount is pre-filled).<br/>
                2. <strong>Static QR Image:</strong> Upload your personal QR code screenshot. This is used if UPI ID is empty or as a fallback.<br/>
                3. <strong>Referral Bonus:</strong> Set the percentage commission for referrals.<br/>
                4. <strong>Withdrawal Fee:</strong> Set the service fee percentage deducted from user withdrawals.
            </div>
            <form onSubmit={handleSettingsSubmit} className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">UPI ID (For Dynamic QR)</label>
                    <input 
                        type="text" 
                        value={qrForm.upiId} 
                        onChange={e => setQrForm({...qrForm, upiId: e.target.value})}
                        className="w-full p-3 border rounded-lg bg-gray-50 font-mono"
                        placeholder="e.g. merchant@upi (Leave empty to use Static QR only)"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Leave empty to disable dynamic generation and force use of the uploaded image below.</p>
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Static Payment QR Code Image</label>
                    <div className="flex items-center gap-4">
                        <div className="w-32 h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                                {qrForm.qrCodeUrl ? (
                                    <img src={qrForm.qrCodeUrl} alt="QR Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400">
                                        <QrCode size={24} />
                                        <span className="text-[10px] mt-1 font-medium">No Image</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleQrUpload}
                                    className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" 
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Upload your payment QR screenshot (Max 1MB). Used when UPI ID is not set.</p>
                                {qrForm.qrCodeUrl && (
                                    <button 
                                        type="button"
                                        onClick={() => setQrForm(prev => ({...prev, qrCodeUrl: ''}))}
                                        className="mt-2 text-[10px] text-red-500 hover:text-red-700 font-bold"
                                    >
                                        Remove Image
                                    </button>
                                )}
                            </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Referral Bonus Percentage (%)</label>
                    <input 
                        type="number"
                        min="0"
                        max="100"
                        value={qrForm.referralBonusPercentage} 
                        onChange={e => setQrForm({...qrForm, referralBonusPercentage: Number(e.target.value)})}
                        className="w-full p-3 border rounded-lg bg-gray-50"
                        placeholder="10"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Withdrawal Fee Percentage (%)</label>
                    <input 
                        type="number"
                        min="0"
                        max="100"
                        value={qrForm.withdrawalFeePercentage ?? 5} 
                        onChange={e => setQrForm({...qrForm, withdrawalFeePercentage: Number(e.target.value)})}
                        className="w-full p-3 border rounded-lg bg-gray-50"
                        placeholder="5"
                    />
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">Save System Settings</button>
            </form>
          </div>

          <div className="border-t border-gray-100 pt-8">
              <h2 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                  <Lock size={20} className="mr-2 text-gray-600" /> Admin Security
              </h2>
              <form onSubmit={handleAdminCredsSubmit} className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Admin Email</label>
                        <input 
                            type="email" 
                            value={adminCreds.email} 
                            onChange={e => setAdminCreds({...adminCreds, email: e.target.value})}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-400 outline-none"
                            placeholder="newadmin@example.com"
                            required
                        />
                    </div>
                    <div>
                         {/* Spacer or additional info */}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
                        <input 
                            type="password" 
                            value={adminCreds.password} 
                            onChange={e => setAdminCreds({...adminCreds, password: e.target.value})}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-400 outline-none"
                            placeholder="Leave empty to keep current"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
                        <input 
                            type="password" 
                            value={adminCreds.confirmPassword} 
                            onChange={e => setAdminCreds({...adminCreds, confirmPassword: e.target.value})}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-400 outline-none"
                            placeholder="Confirm new password"
                        />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                      <button type="submit" className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-black transition-colors text-sm">
                          Update Credentials
                      </button>
                  </div>
              </form>
          </div>

          {/* Danger Zone */}
          <div className="border-t-4 border-red-100 pt-8 mt-8">
              <h2 className="text-lg font-bold mb-4 flex items-center text-red-700">
                  <AlertTriangle size={20} className="mr-2" /> Danger Zone
              </h2>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex justify-between items-center">
                  <div>
                      <h3 className="font-bold text-red-900 text-sm">Factory Reset System</h3>
                      <p className="text-xs text-red-700 mt-1">This will permanently delete ALL users, orders, and transactions. Products will reset to default.</p>
                  </div>
                  <button 
                    onClick={confirmReset}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
                  >
                      Reset Data
                  </button>
              </div>
          </div>
      </div>
  );

  // --- Main Render ---
  return (
    <div className="pb-20">
        <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar mb-4">
            <button onClick={() => setView('dashboard')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${view === 'dashboard' ? 'bg-[#2c1810] text-white' : 'bg-white text-gray-600'}`}>Dashboard</button>
            <button onClick={() => setView('users')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${view === 'users' ? 'bg-[#2c1810] text-white' : 'bg-white text-gray-600'}`}>Users</button>
            <button onClick={() => setView('orders')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${view === 'orders' ? 'bg-[#2c1810] text-white' : 'bg-white text-gray-600'}`}>Orders</button>
            <button onClick={() => setView('products')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${view === 'products' ? 'bg-[#2c1810] text-white' : 'bg-white text-gray-600'}`}>Products</button>
            <button onClick={() => setView('recharges')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${view === 'recharges' ? 'bg-[#2c1810] text-white' : 'bg-white text-gray-600'}`}>Recharges</button>
            <button onClick={() => setView('withdrawals')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${view === 'withdrawals' ? 'bg-[#2c1810] text-white' : 'bg-white text-gray-600'}`}>Withdrawals</button>
            <button onClick={() => setView('settings')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${view === 'settings' ? 'bg-[#2c1810] text-white' : 'bg-white text-gray-600'}`}>Settings</button>
        </div>

        {view === 'dashboard' && <DashboardView />}
        {view === 'users' && <UsersView />}
        {view === 'orders' && <OrdersView />}
        {view === 'products' && <ProductsView />}
        {view === 'recharges' && <RechargesView />}
        {view === 'withdrawals' && <WithdrawalsView />}
        {view === 'settings' && <SettingsView />}

        {/* Edit User Modal */}
        {editingUser && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden animate-bounce-in">
                    <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
                        <h3 className="font-bold">Manage User</h3>
                        <button onClick={() => setEditingUser(null)}><X size={18} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="text-center mb-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-2 font-bold text-xl text-gray-700">
                                {editingUser.username.charAt(0).toUpperCase()}
                            </div>
                            <h4 className="font-bold text-gray-800">{editingUser.username}</h4>
                            <p className="text-xs text-gray-500">{editingUser.email}</p>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Wallet Balance (₹)</label>
                            <input 
                                type="number" 
                                value={editForm.balance}
                                onChange={(e) => setEditForm({...editForm, balance: e.target.value})}
                                className="w-full p-2 border rounded text-sm"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Manually set user balance</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Reset Password</label>
                            <input 
                                type="text" 
                                value={editForm.password}
                                onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                                className="w-full p-2 border rounded text-sm"
                                placeholder="Enter new password"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Leave empty to keep current password</p>
                        </div>

                        <div className="flex gap-2 pt-2">
                             <button 
                                onClick={handleDeleteUser}
                                className="flex-1 bg-red-50 text-red-600 py-2 rounded font-bold text-xs hover:bg-red-100"
                             >
                                 Delete User
                             </button>
                             <button 
                                onClick={handleSaveUser}
                                className="flex-1 bg-green-600 text-white py-2 rounded font-bold text-xs hover:bg-green-700"
                             >
                                 Save Changes
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};