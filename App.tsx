import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Invest } from './components/Invest.tsx';
import { Wallet } from './components/Wallet.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { AIChat } from './components/AIChat.tsx';
import { Auth } from './components/Auth.tsx';
import { Referral } from './components/Referral.tsx';
import { About } from './components/About.tsx';
import { AppState, Product, User, AppSettings } from './types.ts';
import { api } from './services/api.ts';
import { CheckCircle, AlertTriangle, XCircle, Info, RefreshCw, Activity, Cpu } from 'lucide-react';

declare global {
  interface Window {
    Pi: any;
  }
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [isWakingUp, setIsWakingUp] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [connectionError, setConnectionError] = useState(false);
  const [wakeUpAttempt, setWakeUpAttempt] = useState(0);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000); 
  };

  useEffect(() => {
    const initPi = async () => {
        if (window.Pi) {
            try {
                await window.Pi.init({ version: "2.0", sandbox: true });
                console.log("✅ Pi SDK Ready");
            } catch (err) {
                console.warn("⚠️ Pi SDK Init Warning:", err);
            }
        }
    };
    initPi();
  }, []);

  const waitForServer = async (retries = 60, delay = 1500): Promise<boolean> => {
      try {
          await api.checkHealth();
          return true;
      } catch (e) {
          if (retries > 0) {
              setWakeUpAttempt(60 - retries + 1);
              await new Promise(r => setTimeout(r, delay));
              return waitForServer(retries - 1, delay);
          }
          throw e;
      }
  };

  const loadData = async (currentUser: User | null) => {
      try {
          const data = await api.getInitialState(currentUser);
          setState(prev => ({
              ...prev,
              ...data,
              currentUser: data.currentUser
          }));

          if (currentUser && !data.currentUser) {
              setIsAuth(false);
              localStorage.removeItem('royal_user_id');
          } else if (data.currentUser?.role === 'admin') {
              setActiveTab('admin');
          }
          return true;
      } catch (error: any) {
          throw error;
      }
  };

  const fetchData = async () => {
      try {
          const data = await api.getInitialState(state.currentUser);
          setState(prev => ({ ...prev, ...data }));
          setConnectionError(false);
      } catch (error) {
          console.error("Sync Error:", error);
      }
  };

  useEffect(() => {
      const init = async () => {
        setIsLoading(true);
        setIsWakingUp(true);
        setConnectionError(false);
        setWakeUpAttempt(0);
        
        const storedUserId = localStorage.getItem('royal_user_id');
        let restoredUser = null;
        
        if (storedUserId && storedUserId !== 'undefined' && storedUserId !== 'null') {
            restoredUser = { id: storedUserId } as User;
            setIsAuth(true); 
        }

        try {
            await waitForServer();
            setIsWakingUp(false);
            await loadData(restoredUser);
        } catch (error: any) {
            setConnectionError(true);
        } finally {
            setIsLoading(false);
        }
      };
      init();
  }, []);

  useEffect(() => {
      if (!isAuth) return;
      const isAdmin = state.currentUser?.role === 'admin';
      const interval = setInterval(() => fetchData(), isAdmin ? 15000 : 30000); 
      return () => clearInterval(interval);
  }, [isAuth, state.currentUser?.role]);

  const handleLogin = async (email: string, password: string) => {
      try {
          const user = await api.login(email, password);
          localStorage.setItem('royal_user_id', user.id);
          setState(prev => ({ ...prev, currentUser: user }));
          setIsAuth(true);
          showToast(`Greetings, ${user.username}!`, 'success');
          setActiveTab(user.role === 'admin' ? 'admin' : 'dashboard');
          fetchData();
      } catch (err: any) {
          throw new Error(err.message || 'Verification failed');
      }
  };

  const handleRegister = async (data: any) => {
      try {
          const user = await api.register(data);
          localStorage.setItem('royal_user_id', user.id);
          setState(prev => ({ ...prev, currentUser: user }));
          setIsAuth(true);
          setActiveTab('dashboard');
          showToast('Account Created Successfully', 'success');
          fetchData();
      } catch (err: any) {
          throw new Error(err.message || 'Creation failed');
      }
  };

  const handleLogout = () => {
    localStorage.removeItem('royal_user_id');
    setIsAuth(false);
    setState(prev => ({ ...prev, currentUser: null }));
    setActiveTab('dashboard');
    showToast('Session Closed.', 'info');
  };

  const handleClaim = async () => {
    if (!state.currentUser) return;
    try {
      const result = await api.claim(state.currentUser.id);
      showToast(`Success! You claimed ₹${result.amount.toFixed(2)}`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Claim failed', 'error');
    }
  };

  const handleInvest = async (product: Product) => {
    if (!state.currentUser) return;
    try {
      await api.invest(state.currentUser.id, product.id);
      showToast(`Investment in ${product.name} successful!`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Investment failed', 'error');
    }
  };

  const handleRecharge = async (amount: number) => {
    if (!state.currentUser) return;
    try {
      await api.recharge(state.currentUser.id, amount);
      showToast('Recharge request submitted successfully!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Recharge failed', 'error');
    }
  };

  const handleWithdraw = async (amount: number, details: any) => {
    if (!state.currentUser) return;
    try {
      await api.withdraw(state.currentUser.id, amount, details);
      showToast('Withdrawal request submitted!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Withdrawal failed', 'error');
    }
  };

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#1a0f0a] p-6">
              <div className="text-center text-white bg-[#2c1810] p-10 rounded-3xl shadow-2xl max-w-sm w-full border border-amber-900/20 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/20">
                      <div className="h-full bg-amber-500 animate-[progress_2s_infinite] w-1/3"></div>
                  </div>
                  <div className="relative mb-8">
                      <div className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-full"></div>
                      <Cpu size={56} className="mx-auto text-amber-500 relative z-10 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tighter uppercase mb-2">Royal Hub</h2>
                  <p className="text-amber-200/40 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">
                      {isWakingUp ? `Initializing Secure Node (Attempt ${wakeUpAttempt})` : 'Syncing Blockchain Data'}
                  </p>
              </div>
          </div>
      );
  }

  if (connectionError && !isAuth) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#1a0f0a] p-6">
              <div className="text-center bg-white p-10 rounded-3xl shadow-2xl max-w-sm w-full border-t-8 border-red-500">
                  <div className="bg-red-50 p-5 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <AlertTriangle size={40} className="text-red-500" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Node Offline</h2>
                  <p className="text-gray-500 mb-8 text-xs font-medium leading-relaxed uppercase tracking-wide">
                      Unable to establish a secure link with the central database.
                  </p>
                  <button onClick={() => window.location.reload()} className="w-full bg-[#1a0f0a] text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center group">
                      <RefreshCw size={18} className="mr-3 group-hover:rotate-180 transition-transform duration-700" /> Retry Link
                  </button>
              </div>
          </div>
      );
  }

  return (
    <>
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-xs px-4">
            {toasts.map(toast => (
                <div key={toast.id} className={`shadow-2xl rounded-2xl p-4 flex items-center justify-between text-white animate-slide-up border border-white/10 backdrop-blur-md ${
                    toast.type === 'success' ? 'bg-emerald-600/90' :
                    toast.type === 'error' ? 'bg-rose-600/90' :
                    'bg-zinc-900/90'
                }`}>
                    <div className="flex items-center gap-3">
                        {toast.type === 'success' && <CheckCircle size={18} />}
                        {toast.type === 'error' && <XCircle size={18} />}
                        {toast.type === 'info' && <Info size={18} />}
                        <span className="font-bold text-[10px] uppercase tracking-wider">{toast.message}</span>
                    </div>
                </div>
            ))}
        </div>

        {!isAuth ? (
            <Auth onLogin={handleLogin} onRegister={handleRegister} />
        ) : (
            <Layout 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                onLogout={handleLogout}
                isAdmin={state.currentUser?.role === 'admin'}
            >
            {activeTab === 'dashboard' && state.currentUser && state.currentUser.role !== 'admin' && (
                <Dashboard user={state.currentUser} products={state.products} onClaim={handleClaim} />
            )}
            {activeTab === 'invest' && state.currentUser && state.currentUser.role !== 'admin' && (
                <Invest products={state.products} user={state.currentUser} onInvest={handleInvest} />
            )}
            {activeTab === 'wallet' && state.currentUser && state.currentUser.role !== 'admin' && (
                <Wallet user={state.currentUser} settings={state.settings} onRecharge={handleRecharge} onWithdraw={handleWithdraw} />
            )}
            {activeTab === 'referral' && state.currentUser && state.currentUser.role !== 'admin' && (
                <Referral user={state.currentUser} allUsers={state.users} products={state.products} settings={state.settings} />
            )}
             {activeTab === 'about' && state.currentUser.role !== 'admin' && (
                <About />
            )}
            
            {activeTab === 'admin' && state.currentUser?.role === 'admin' && (
                <AdminPanel 
                    currentUser={state.currentUser}
                    users={state.users}
                    products={state.products}
                    settings={state.settings}
                    onAddProduct={(p) => api.addProduct(p).then(fetchData)}
                    onDeleteProduct={(id) => api.deleteProduct(id).then(fetchData)}
                    onUpdateSettings={(s) => api.updateSettings(s).then(fetchData)}
                    onApproveWithdrawal={(u, t) => api.handleTransaction(u, t, 'approve').then(fetchData)}
                    onRejectWithdrawal={(u, t) => api.handleTransaction(u, t, 'reject').then(fetchData)}
                    onApproveRecharge={(u, t) => api.handleTransaction(u, t, 'approve').then(fetchData)}
                    onRejectRecharge={(u, t) => api.handleTransaction(u, t, 'reject').then(fetchData)}
                    onNavigate={setActiveTab}
                    onUpdateAdminCredentials={(e, p) => api.updateUser(state.currentUser!.id, { email: e, password: p }).then(fetchData)}
                    onResetData={() => api.resetData().then(() => window.location.reload())}
                    onUpdateUser={(uid, upd) => api.updateUser(uid, upd).then(fetchData)}
                />
            )}
            
            {state.currentUser && state.currentUser.role !== 'admin' && <AIChat balance={state.currentUser.balance} />}
            </Layout>
        )}
    </>
  );
}

export default App;