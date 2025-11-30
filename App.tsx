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
import { loadState, saveState, clearState } from './services/storage';

function App() {
  const [state, setState] = useState<AppState>({ 
      currentUser: null, 
      users: [], 
      products: [], 
      settings: { upiId: '', qrCodeUrl: '', referralBonusPercentage: 10, withdrawalFeePercentage: 5 }
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuth, setIsAuth] = useState(false);

  // Initialize
  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    if (loaded.currentUser) {
      setIsAuth(true);
      // Maintain tab state or default based on role
      if (loaded.currentUser.role === 'admin') {
          // If reloading as admin, default to admin panel if currently on dashboard
          setActiveTab('admin');
      }
    }
  }, []);

  // Persistence
  useEffect(() => {
      saveState(state);
  }, [state]);

  // Security Note: The AdminPanel component handles internal security checks 
  // and provides a navigation button to return to the dashboard if access is denied.

  // Helpers to update a specific user
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
      setState(prev => ({ ...prev, currentUser: user }));
      setIsAuth(true);
      
      // Auto-redirect admins to the Admin Panel
      if (user.role === 'admin') {
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
  };

  const handleLogout = () => {
    setIsAuth(false);
    setState(prev => ({ ...prev, currentUser: null }));
    setActiveTab('dashboard');
  };

  // --- Transactions ---

  const handleRecharge = (amount: number) => {
    if (!state.currentUser) return;
    const newTx: Transaction = {
      id: Date.now().toString(),
      type: 'recharge',
      amount,
      date: new Date().toISOString(),
      status: 'pending', // Recharges are now PENDING until admin approval
      userId: state.currentUser.id
    };
    
    // Update local and global - Balance NOT updated yet
    const updatedUser = {
        ...state.currentUser,
        // balance: state.currentUser.balance + amount, // REMOVED: Balance only updates on approval
        transactions: [...state.currentUser.transactions, newTx]
    };
    updateUser(state.currentUser.id, updatedUser);
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

    // Deduct balance immediately
    const updatedUser = {
        ...state.currentUser,
        balance: state.currentUser.balance - amount,
        transactions: [...state.currentUser.transactions, newTx]
    };
    updateUser(state.currentUser.id, updatedUser);
  };

  const handleInvest = (product: Product) => {
    if (!state.currentUser) return;
    if (state.currentUser.balance < product.price) return;

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
      userId: state.currentUser.id
    };

    // Prepare for atomic update of potentially two users (investor and referrer)
    let updatedUsers = [...state.users];
    
    // Configurable Bonus Percentage from Settings. Use nullish coalescing to allow 0.
    const bonusPercentage = state.settings.referralBonusPercentage ?? 10;

    // Referral Logic: Check if this is the first investment and if there is a referrer
    if (state.currentUser.investments.length === 0 && state.currentUser.referredBy) {
      const referrerIndex = updatedUsers.findIndex(u => u.referralCode === state.currentUser!.referredBy);
      if (referrerIndex !== -1) {
        const referrer = updatedUsers[referrerIndex];
        const bonusAmount = product.price * (bonusPercentage / 100);
        
        const bonusTx: Transaction = {
          id: Date.now().toString() + '-ref',
          type: 'referral',
          amount: bonusAmount,
          date: new Date().toISOString(),
          status: 'success',
          userId: referrer.id
        };

        const updatedReferrer = {
          ...referrer,
          balance: referrer.balance + bonusAmount,
          transactions: [...referrer.transactions, bonusTx]
        };

        updatedUsers[referrerIndex] = updatedReferrer;
      }
    }

    // Update Current User (Investor)
    const updatedCurrentUser = {
        ...state.currentUser,
        balance: state.currentUser.balance - product.price,
        investments: [...state.currentUser.investments, newInvestment],
        transactions: [...state.currentUser.transactions, newTx]
    };

    // Update the investor in the users array
    const currentUserIndex = updatedUsers.findIndex(u => u.id === state.currentUser!.id);
    if (currentUserIndex !== -1) {
      updatedUsers[currentUserIndex] = updatedCurrentUser;
    }

    // Commit state
    setState(prev => ({
        ...prev,
        users: updatedUsers,
        currentUser: updatedCurrentUser
    }));
    setActiveTab('dashboard');
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
    }
  };

  // --- Admin Functions ---

  const handleAddProduct = (product: Product) => {
    setState(prev => ({ ...prev, products: [...prev.products, product] }));
  };

  const handleDeleteProduct = (id: string) => {
      setState(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
      setState(prev => ({ ...prev, settings: newSettings }));
  };

  const handleUpdateAdminCredentials = (email: string, password: string) => {
    if (!state.currentUser || state.currentUser.role !== 'admin') return;

    // Check if email is already taken by another user
    if (state.users.some(u => u.email === email && u.id !== state.currentUser?.id)) {
        alert('This email is already in use by another user.');
        return;
    }

    updateUser(state.currentUser.id, { email, password });
    alert('Admin credentials updated successfully. Please use your new email and password next time you login.');
  };

  const handleApproveRecharge = (userId: string, txId: string) => {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    
    const tx = user.transactions.find(t => t.id === txId);
    if (!tx || tx.status !== 'pending') return;

    const updatedTx = user.transactions.map(t => 
        t.id === txId ? { ...t, status: 'success' } : t
    ) as Transaction[];

    // Add Balance on Approval
    updateUser(userId, { 
        balance: user.balance + tx.amount,
        transactions: updatedTx 
    });
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
  };

  const handleRejectWithdrawal = (userId: string, txId: string) => {
      const user = state.users.find(u => u.id === userId);
      if (!user) return;

      const tx = user.transactions.find(t => t.id === txId);
      // Safety check: Only refund if the status was currently pending
      if (!tx || tx.status !== 'pending') return;

      const updatedTx = user.transactions.map(t => 
        t.id === txId ? { ...t, status: 'rejected' } : t
      ) as Transaction[];

      // Refund balance
      updateUser(userId, { 
          balance: user.balance + tx.amount,
          transactions: updatedTx 
      });
  };


  if (!isAuth) {
    return <Auth onLogin={handleLogin} onRegister={handleRegister} users={state.users} />;
  }

  return (
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
          />
      )}
      
      {state.currentUser && <AIChat balance={state.currentUser.balance} />}
    </Layout>
  );
}

export default App;