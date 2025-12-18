import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Invest } from './components/Invest';
import { Wallet } from './components/Wallet';
import { AdminPanel } from './components/AdminPanel';
import { AIChat } from './components/AIChat';
import { Auth } from './components/Auth';
import { Referral } from './components/Referral';
import { About } from './components/About';
import { AppState, Product, User, AppSettings } from './types';
import { api } from './services/api';
import { CheckCircle, AlertTriangle, XCircle, Info, Loader2, RefreshCw, Activity, ShieldCheck } from 'lucide-react';

// Declare Pi SDK on window for TypeScript
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
  const [errorMessage, setErrorMessage] = useState('');
  const [wakeUpAttempt, setWakeUpAttempt] = useState(0);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000); 
  };

  // --- Pi Network Initialization ---
  useEffect(() => {
    const initPi = async () => {
        if (window.Pi) {
            try {
                await window.Pi.init({ version: "2.0", sandbox: true });
                console.log("✅ Pi SDK Initialized (Sandbox: true)");
            } catch (err) {
                console.error("❌ Pi SDK Init Error:", err);
            }
        }
    };
    initPi();
  }, []);

  const waitForServer = async (retries = 90, delay = 1000): Promise<boolean> => {
      try {
          await api.checkHealth();
          return true;
      } catch (e) {
          if (retries > 0) {
              setWakeUpAttempt(90 - retries + 1);
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
          console.error("Background refresh failed:", error);
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
            setErrorMessage(error.message || "Failed to connect to backend.");
        } finally {
            setIsLoading(false);
        }
      };
      init();
  }, []);

  useEffect(() => {
      if (!isAuth) return;
      const isAdmin = state.currentUser?.role === 'admin';
      const interval = setInterval(() => fetchData(), isAdmin ? 15000 : 45000); 
      return () => clearInterval(interval);
  }, [isAuth, state.currentUser?.role, state.currentUser?.id]);

  const handleLogin = async (email: string, password: string) => {
      try {
          const user = await api.login(email, password);
          localStorage.setItem('royal_user_id', user.id);
          setState(prev => ({ ...prev, currentUser: user }));
          setIsAuth(true);
          showToast(`Welcome back, ${user.username}!`, 'success');
          setActiveTab(user.role === 'admin' ? 'admin' : 'dashboard');
          fetchData();
      } catch (err: any) {
          throw new Error(err.message || 'Login failed');
      }
  };

  const handleRegister = async (data: any) => {
      try {
          const user = await api.register(data);
          localStorage.setItem('royal_user_id', user.id);
          setState(prev => ({ ...prev, currentUser: user }));
          setIsAuth(true);
          setActiveTab('dashboard');
          showToast('Registration successful!', 'success');
          fetchData();
      } catch (err: any) {
          throw new Error(err.message || 'Registration failed');
      }
  };

  const handleLogout = () => {
    localStorage.removeItem('royal_user_id');
    setIsAuth(false);
    setState(prev => ({ ...prev, currentUser: null }));
    setActiveTab('dashboard');
    showToast('Logged out.', 'info');
  };

  const handleInvest = async (product: Product) => {
    if (!state.currentUser) return;
    try {
        await api.invest(state.currentUser.id, product.id);
        showToast(`Invested in ${product.name}!`, 'success');
        await fetchData(); 
    } catch (err: any) {
        showToast(err.message || 'Investment failed', 'error');
    }
  };

  const handleClaim = async () => {
    if (!state.currentUser) return;
    try {
        const res = await api.claim(state.currentUser.id);
        showToast(`Collected ₹${res.amount.toFixed(2)} profit!`, 'success');
        await fetchData();
    } catch (err: any) {
        showToast(err.message || 'Claim failed', 'error'); 
    }
  };

  const handleRecharge = async (amount: number) => {
    if (!state.currentUser) return;
    try {
        await api.recharge(state.currentUser.id, amount);
        showToast('Recharge pending approval.', 'success');
        await fetchData();
    } catch (err: any) {
        showToast(err.message, 'error');
    }
  };

  const handleWithdraw = async (amount: number, details: any) => {
    if (!state.currentUser) return;
    try {
        await api.withdraw(state.currentUser.id, amount, details);
        showToast('Withdrawal request submitted!', 'success');
        await fetchData();
    } catch (err: any) {
        showToast(err.message, 'error');
    }
  };

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#2c1810] p-4 font-sans">
              <div className="text-center text-white bg-[#3d2319] p-10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-sm w-full border border-amber-900/30">
                  <div className="relative mb-8">
                      <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full"></div>
                      <Loader2 size={64} className="animate-spin mx-auto text-amber-500 relative z-10" />
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <ShieldCheck size={18} className="text-amber-500" />
                    <h2 className="text-2xl font-black tracking-tight uppercase">Royal Hub</h2>
                  </div>
                  
                  {isWakingUp ? (
                      <div className="space-y-4">
                          <p className="text-amber-100/60 text-xs font-medium uppercase tracking-[0.2em]">
                             Waking up Pi Gateway
                          </p>
                          <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5">
                              <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full animate-[progress_2s_infinite] w-full origin-left"></div>
                          </div>
                          <div className="bg-black/30 rounded-lg py-2 px-4 flex items-center justify-between border border-white/5">
                               <Activity size={14} className="text-amber-400 animate-pulse" />
                               <span className="text-[10px] text-amber-400 font-mono font-bold">ATTEMPT {wakeUpAttempt} / 90</span>
                          </div>
                      </div>
                  ) : (
                       <p className="text-amber-100/60 text-xs font-medium uppercase tracking-[0.2em] animate-pulse">
                          Syncing Secure Data...
                       </p>
                  )}
              </div>
          </div>
      );
  }

  if (connectionError && !isAuth) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#2c1810] p-6 font-sans">
              <div className="text-center bg-white p-10 rounded-2xl shadow-2xl max-w-sm w-full animate-bounce-in border-b-8 border-red-500">
                  <div className="bg-red-50 p-5 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center border-2 border-red-100">
                    <AlertTriangle size={48} className="text-red-500" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Access Error</h2>
                  <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                      Could not establish a secure connection to Royal Hub servers.
                  </p>
                  
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full bg-[#2c1810] text-white px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center group"
                  >
                      <RefreshCw size={18} className="mr-2 group-hover:rotate-180 transition-transform duration-500" /> Reconnect
                  </button>
              </div>
          </div>
      );
  }

  return (
    <>
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4">
            {toasts.map(toast => (
                <div key={toast.id} className={`shadow-2xl rounded-xl p-4 flex items-center justify-between text-white animate-slide-up border border-white/10 ${
                    toast.type === 'success' ? 'bg-emerald-600' :
                    toast.type === 'error' ? 'bg-rose-600' :
                    'bg-zinc-900'
                }`}>
                    <div className="flex items-center gap-3">
                        {toast.type === 'success' && <CheckCircle size={20} />}
                        {toast.type === 'error' && <XCircle size={20} />}
                        {toast.type === 'info' && <Info size={20} />}
                        <span className="font-bold text-xs uppercase tracking-wider">{toast.message}</span>
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