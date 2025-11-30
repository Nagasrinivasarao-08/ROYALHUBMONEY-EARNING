import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Invest } from './components/Invest';
import { Wallet } from './components/Wallet';
import { AdminPanel } from './components/AdminPanel';
import { AIChat } from './components/AIChat';
import { Auth } from './components/Auth';
import { Referral } from './components/Referral';
import { AppState, Product, User, Transaction, Investment, AppSettings } from './types';
import { loadState, saveState, resetData } from './services/storage';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

// --- Toast Notification System ---
interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

function App() {
  const [state, setState] = useState<AppState>({ 
      currentUser: null, 
      users: [], 
      products: [], 
      settings: { upiId: '', qrCodeUrl: '', referralBonusPercentage: 10, withdrawalFeePercentage: 5 }
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuth, setIsAuth] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
  };

  // Initialize & Sync
  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    if (loaded.currentUser) {
      setIsAuth(true);
      if (loaded.currentUser.role === 'admin') {
          setActiveTab('admin');
      }
    }

    // Storage Event Listener for Cross-Tab Sync
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'investflow_db_v3_royal') {
            const newState = loadState();
            setState(newState);
            // If user was logged in but removed in another tab, log them out
            if (state.currentUser && !newState.users.find(u => u.id === state.currentUser?.id)) {
                handleLogout();
            }
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Persistence
  useEffect(() => {
      saveState(state);
  }, [state]);

  // Helpers to update a specific user safely
  const updateUser = (userId: string, updates: Partial<User>) => {
      setState(prev => {
          const updatedUsers = prev.users.map(u => u.id === userId ? { ...u, ...updates } : u);
          const updatedCurrentUser = prev.currentUser?.id === userId ? { ...prev.currentUser, ...updates } : prev.currentUser;
          return {
              ...prev,
              users: updatedUsers,
              currentUser: updatedCurrentUser
          };
      });
  };

  const handleLogin = (user: User) => {
      // Always get fresh user data from state
      const freshUser = state.users.find(u => u.id === user.id) || user;
      setState(prev => ({ ...prev, currentUser: freshUser }));
      setIsAuth(true);
      showToast(`Welcome back, ${freshUser.username}!`, 'success');
      
      if (freshUser.role === 'admin') {
          setActiveTab('admin');
      } else {
          setActiveTab('dashboard');
      }
  };

  const handleRegister = (newUser: User) => {
      setState(prev => ({ 
          ...prev, 
          users: [...prev.users, newUser],
          currentUser: newUser 
      }));
      setIsAuth(true);
      setActiveTab('dashboard');
      showToast('Registration successful! Welcome to Royal Hub.', 'success');
  };

  const handleLogout = () => {
    setIsAuth(false);
    setState(prev => ({ ...prev, currentUser: null }));
    setActiveTab('dashboard');
    showToast('Logged out successfully.', 'info');
  };

  // --- Transactions ---

  const handleRecharge = (amount: number) => {
    if (!state.currentUser) return;
    const newTx: Transaction = {
      id: Date.now().toString(),
      type: 'recharge',
      amount,
      date: new Date().toISOString(),
      status: 'pending',
      userId: state.currentUser.id
    };
    
    const updatedUser = {
        ...state.currentUser,
        transactions: [...state.currentUser.transactions, newTx]
    };
    updateUser(state.currentUser.id, updatedUser);
    showToast('Recharge submitted! Pending Admin approval.', 'success');
  };

  const handleWithdraw = (amount: number, details: { method: 'upi' | 'bank', info: string }) => {
    if (!state.currentUser) return;
    const newTx: Transaction = {
      id: Date.now().toString(),
      type: 'withdrawal',
      amount,
      date: new Date().toISOString(),
      status: 'pending',
      userId: state.currentUser.id,
      withdrawalDetails: {
          method: details.method,
          details: details.info
      }
    };

    const updatedUser = {
        ...state.currentUser,
        balance: state.currentUser.balance - amount,
        transactions: [...state.currentUser.transactions, newTx]
    };
    updateUser(state.currentUser.id, updatedUser);
    showToast('Withdrawal request submitted!', 'success');
  };

  const handleInvest = (product: Product) => {
    if (!state.currentUser) return;
    if (state.currentUser.balance < product.price) {
        showToast('Insufficient balance!', 'error');
        return;
    }

    setState(prev => {
        const currentUser = prev.currentUser!;
        
        const newInvestment: Investment = {
            id: Date.now().toString(),
            productId: product.id,
            purchaseDate: new Date().toISOString(),
            lastClaimDate: new Date().toISOString(),
            claimedAmount: 0
        };

        const newTx: Transaction = {
            id: Date.now().toString(),
            type: 'investment',
            amount: product.price,
            date: new Date().toISOString(),
            status: 'success',
            userId: currentUser.id
        };

        let updatedCurrentUser = {
            ...currentUser,
            balance: currentUser.balance - product.price,
            investments: [...currentUser.investments, newInvestment],
            transactions: [...currentUser.transactions, newTx]
        };

        let updatedReferrer = null;
        const bonusPercentage = prev.settings.referralBonusPercentage ?? 10;

        // Referral Logic
        if (currentUser.investments.length === 0 && currentUser.referredBy) {
            const referrer = prev.users.find(u => u.referralCode === currentUser.referredBy);
            if (referrer) {
                const bonusAmount = product.price * (bonusPercentage / 100);
                const bonusTx: Transaction = {
                    id: Date.now().toString() + '-ref',
                    type: 'referral',
                    amount: bonusAmount,
                    date: new Date().toISOString(),
                    status: 'success',
                    userId: referrer.id
                };

                updatedReferrer = {
                    ...referrer,
                    balance: referrer.balance + bonusAmount,
                    transactions: [...referrer.transactions, bonusTx]
                };
            }
        }

        // Map over users to apply updates
        const updatedUsers = prev.users.map(u => {
            if (u.id === currentUser.id) return updatedCurrentUser;
            if (updatedReferrer && u.id === updatedReferrer.id) return updatedReferrer;
            return u;
        });

        return {
            ...prev,
            users: updatedUsers,
            currentUser: updatedCurrentUser
        };
    });

    setActiveTab('dashboard');
    showToast(`Successfully invested in ${product.name}!`, 'success');
  };

  const handleClaim = () => {
    if (!state.currentUser) return;
    let totalClaim = 0;
    const now = new Date().toISOString();
    
    const updatedInvestments = state.currentUser.investments.map(inv => {
        const product = state.products.find(p => p.id === inv.productId);
        if(!product) return inv;

        const lastClaim = new Date(inv.lastClaimDate).getTime();
        const currentTime = new Date().getTime();
        const INTERVAL = 10000; 

        if (currentTime - lastClaim >= INTERVAL) {
            totalClaim += product.dailyIncome;
            return { ...inv, lastClaimDate: now, claimedAmount: inv.claimedAmount + product.dailyIncome };
        }
        return inv;
    });

    if (totalClaim > 0) {
        const newTx: Transaction = {
            id: Date.now().toString(),
            type: 'income',
            amount: totalClaim,
            date: now,
            status: 'success',
            userId: state.currentUser.id
        };

        const updatedUser = {
            ...state.currentUser,
            balance: state.currentUser.balance + totalClaim,
            investments: updatedInvestments,
            transactions: [...state.currentUser.transactions, newTx]
        };
        updateUser(state.currentUser.id, updatedUser);
        showToast(`Collected ₹${totalClaim.toFixed(2)} profit!`, 'success');
    }
  };

  // --- Admin Functions ---

  const handleAddProduct = (product: Product) => {
    setState(prev => ({ ...prev, products: [...prev.products, product] }));
    showToast('Product added successfully', 'success');
  };

  const handleDeleteProduct = (id: string) => {
      setState(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
      showToast('Product deleted', 'info');
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
      setState(prev => ({ ...prev, settings: newSettings }));
      showToast('System settings updated', 'success');
  };

  const handleUpdateAdminCredentials = (email: string, password: string) => {
    if (!state.currentUser || state.currentUser.role !== 'admin') return;

    if (state.users.some(u => u.email === email && u.id !== state.currentUser?.id)) {
        showToast('Email already in use.', 'error');
        return;
    }

    updateUser(state.currentUser.id, { email, password });
    showToast('Admin credentials updated.', 'success');
  };

  const handleApproveRecharge = (userId: string, txId: string) => {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    
    const tx = user.transactions.find(t => t.id === txId);
    if (!tx || tx.status !== 'pending') return;

    const updatedTx = user.transactions.map(t => 
        t.id === txId ? { ...t, status: 'success' } : t
    ) as Transaction[];

    updateUser(userId, { 
        balance: user.balance + tx.amount,
        transactions: updatedTx 
    });
    showToast('Recharge approved.', 'success');
  };

  const handleRejectRecharge = (userId: string, txId: string) => {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    
    const tx = user.transactions.find(t => t.id === txId);
    if (!tx || tx.status !== 'pending') return;

    const updatedTx = user.transactions.map(t => 
        t.id === txId ? { ...t, status: 'rejected' } : t
    ) as Transaction[];

    updateUser(userId, { transactions: updatedTx });
    showToast('Recharge rejected.', 'info');
  };

  const handleApproveWithdrawal = (userId: string, txId: string) => {
      const user = state.users.find(u => u.id === userId);
      if (!user) return;
      
      const tx = user.transactions.find(t => t.id === txId);
      if (!tx || tx.status !== 'pending') return;

      const updatedTx = user.transactions.map(t => 
          t.id === txId ? { ...t, status: 'success' } : t
      ) as Transaction[];

      updateUser(userId, { transactions: updatedTx });
      showToast('Withdrawal approved.', 'success');
  };

  const handleRejectWithdrawal = (userId: string, txId: string) => {
      const user = state.users.find(u => u.id === userId);
      if (!user) return;

      const tx = user.transactions.find(t => t.id === txId);
      if (!tx || tx.status !== 'pending') return;

      const updatedTx = user.transactions.map(t => 
        t.id === txId ? { ...t, status: 'rejected' } : t
      ) as Transaction[];

      updateUser(userId, { 
          balance: user.balance + tx.amount,
          transactions: updatedTx 
      });
      showToast('Withdrawal rejected and refunded.', 'info');
  };

  const handleResetData = () => {
      const defaultState = resetData();
      setState(defaultState);
      setIsAuth(false);
      showToast('System Factory Reset Complete.', 'success');
  };


  return (
    <>
        {/* Toast Container */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4">
            {toasts.map(toast => (
                <div key={toast.id} className={`shadow-xl rounded-lg p-4 flex items-center justify-between text-white animate-slide-up ${
                    toast.type === 'success' ? 'bg-green-600' :
                    toast.type === 'error' ? 'bg-red-600' :
                    'bg-gray-800'
                }`}>
                    <div className="flex items-center gap-2">
                        {toast.type === 'success' && <CheckCircle size={20} />}
                        {toast.type === 'error' && <XCircle size={20} />}
                        {toast.type === 'info' && <Info size={20} />}
                        <span className="font-medium text-sm">{toast.message}</span>
                    </div>
                </div>
            ))}
        </div>

        {!isAuth ? (
            <Auth onLogin={handleLogin} onRegister={handleRegister} users={state.users} />
        ) : (
            <Layout 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                onLogout={handleLogout}
                isAdmin={state.currentUser?.role === 'admin'}
            >
            {activeTab === 'dashboard' && state.currentUser && (
                <Dashboard 
                    user={state.currentUser} 
                    products={state.products} 
                    onClaim={handleClaim}
                />
            )}
            {activeTab === 'invest' && state.currentUser && (
                <Invest 
                    products={state.products} 
                    user={state.currentUser} 
                    onInvest={handleInvest} 
                />
            )}
            {activeTab === 'wallet' && state.currentUser && (
                <Wallet 
                    user={state.currentUser} 
                    settings={state.settings}
                    onRecharge={handleRecharge} 
                    onWithdraw={handleWithdraw}
                />
            )}
            {activeTab === 'referral' && state.currentUser && (
                <Referral 
                    user={state.currentUser} 
                    allUsers={state.users} 
                    products={state.products}
                    settings={state.settings} 
                />
            )}
            
            {activeTab === 'admin' && state.currentUser && (
                <AdminPanel 
                    currentUser={state.currentUser}
                    users={state.users}
                    products={state.products}
                    settings={state.settings}
                    onAddProduct={handleAddProduct}
                    onDeleteProduct={handleDeleteProduct}
                    onUpdateSettings={handleUpdateSettings}
                    onApproveWithdrawal={handleApproveWithdrawal}
                    onRejectWithdrawal={handleRejectWithdrawal}
                    onApproveRecharge={handleApproveRecharge}
                    onRejectRecharge={handleRejectRecharge}
                    onNavigate={setActiveTab}
                    onUpdateAdminCredentials={handleUpdateAdminCredentials}
                    onResetData={handleResetData}
                />
            )}
            
            {state.currentUser && <AIChat balance={state.currentUser.balance} />}
            </Layout>
        )}
    </>
  );
}

export default App;