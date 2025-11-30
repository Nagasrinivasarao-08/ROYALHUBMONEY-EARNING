import React, { useEffect, useState, useRef } from 'react';
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
      settings: { upiId: '', qrCodeUrl: '', referralBonusPercentage: 5, withdrawalFeePercentage: 5 }
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuth, setIsAuth] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Ref to track if we need to save state (to avoid saving what we just polled)
  const shouldSaveRef = useRef(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
  };

  // Initialize
  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    if (loaded.currentUser) {
      setIsAuth(true);
      if (loaded.currentUser.role === 'admin') {
          setActiveTab('admin');
      }
    }
  }, []);

  // Real-time Polling & Sync
  useEffect(() => {
    // 1. Listen for cross-tab storage events
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key && e.key.startsWith('investflow_db')) {
            const newState = loadState();
            // Only update if data actually changed to avoid jitters
            if (JSON.stringify(newState) !== JSON.stringify(state)) {
                setState(newState);
                // If user was logged in but removed in another tab, log them out
                if (state.currentUser && !newState.users.find(u => u.id === state.currentUser?.id)) {
                    handleLogout();
                }
            }
        }
    };

    window.addEventListener('storage', handleStorageChange);

    // 2. Poll every 2 seconds to ensure Admin sees new users immediately (even if event fails)
    const intervalId = setInterval(() => {
        // Only poll if we haven't made local changes that are pending save
        if (!shouldSaveRef.current) {
            const latestState = loadState();
            setState(prevState => {
                // Deep comparison to avoid unnecessary re-renders
                if (JSON.stringify(latestState.users) !== JSON.stringify(prevState.users) ||
                    JSON.stringify(latestState.products) !== JSON.stringify(prevState.products) ||
                    JSON.stringify(latestState.settings) !== JSON.stringify(prevState.settings)) {
                    
                    // Preserve current user session but update data
                    let updatedCurrentUser = prevState.currentUser 
                        ? latestState.users.find(u => u.id === prevState.currentUser!.id) || null
                        : null;

                    return {
                        ...latestState,
                        currentUser: updatedCurrentUser
                    };
                }
                return prevState;
            });
        }
    }, 2000);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(intervalId);
    };
  }, []);

  // Persistence - Only save when we initiate a change
  useEffect(() => {
      if (shouldSaveRef.current) {
          saveState(state);
          shouldSaveRef.current = false;
      }
  }, [state]);

  // Helper wrapper to update state and trigger save
  const updateStateAndSave = (updater: (prev: AppState) => AppState) => {
      shouldSaveRef.current = true;
      setState(updater);
  };

  // Helpers to update a specific user safely
  const updateUser = (userId: string, updates: Partial<User>) => {
      updateStateAndSave(prev => {
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
      updateStateAndSave(prev => ({ ...prev, currentUser: freshUser }));
      setIsAuth(true);
      showToast(`Welcome back, ${freshUser.username}!`, 'success');
      
      if (freshUser.role === 'admin') {
          setActiveTab('admin');
      } else {
          setActiveTab('dashboard');
      }
  };

  const handleRegister = (newUser: User) => {
      updateStateAndSave(prev => ({ 
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
    updateStateAndSave(prev => ({ ...prev, currentUser: null }));
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

    // Check for potential referral bonus before update for UI feedback
    const isFirstInvestment = state.currentUser.investments.length === 0;
    const hasReferrer = !!state.currentUser.referredBy;

    updateStateAndSave(prev => {
        const currentUser = prev.currentUser!;
        
        // Create Snapshot of Product to persist terms (even if admin changes/deletes product later)
        const productSnapshot = { ...product };

        const newInvestment: Investment = {
            id: Date.now().toString(),
            productId: product.id,
            purchaseDate: new Date().toISOString(),
            lastClaimDate: new Date().toISOString(),
            claimedAmount: 0,
            productSnapshot: productSnapshot
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
        const bonusPercentage = prev.settings.referralBonusPercentage ?? 5; // Default to 5% if not set

        // Referral Logic: Auto-Add Bonus on FIRST investment only
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
    
    if (isFirstInvestment && hasReferrer) {
        showToast('Referral bonus automatically applied to your inviter!', 'success');
    }
  };

  const handleClaim = () => {
    if (!state.currentUser) return;
    let totalClaim = 0;
    const now = new Date().toISOString();
    
    const updatedInvestments = state.currentUser.investments.map(inv => {
        // Use Snapshot first for accuracy, or fallback to current product list
        const product = inv.productSnapshot || state.products.find(p => p.id === inv.productId);
        
        if(!product) return inv; // Should not happen with snapshot

        const lastClaim = new Date(inv.lastClaimDate).getTime();
        const currentTime = new Date().getTime();
        const INTERVAL = 24 * 60 * 60 * 1000; // 24 Hours

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
    } else {
        showToast('Nothing to claim yet. Please wait for the cycle to complete.', 'info');
    }
  };

  // --- Admin Functions ---

  const handleAddProduct = (product: Product) => {
    updateStateAndSave(prev => ({ ...prev, products: [...prev.products, product] }));
    showToast('Product added successfully', 'success');
  };

  const handleDeleteProduct = (id: string) => {
      updateStateAndSave(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
      showToast('Product deleted', 'info');
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
      updateStateAndSave(prev => ({ ...prev, settings: newSettings }));
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

  // Direct User Management (Admin Edit)
  const handleAdminUpdateUser = (userId: string, updates: Partial<User>) => {
      updateUser(userId, updates);
      showToast('User updated successfully.', 'success');
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
      updateStateAndSave(() => defaultState);
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
                    onUpdateUser={handleAdminUpdateUser}
                />
            )}
            
            {state.currentUser && <AIChat balance={state.currentUser.balance} />}
            </Layout>
        )}
    </>
  );
}

export default App;