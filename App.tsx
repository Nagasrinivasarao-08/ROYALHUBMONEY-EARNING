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
import { CheckCircle, AlertTriangle, XCircle, Info, Loader2, Server, RefreshCw, Activity } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isWakingUp, setIsWakingUp] = useState(true); // New state for wake-up phase
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

  // --- Data Fetching ---

  // Phase 1: Wake Up Server (Fast Polling)
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

  // Phase 2: Load Data (Standard)
  const loadData = async (currentUser: User | null) => {
      try {
          const data = await api.getInitialState(currentUser);
          const isValidUser = !!data.currentUser;
          
          setState(prev => ({
              ...prev,
              ...data,
              currentUser: data.currentUser
          }));

          if (currentUser && !isValidUser) {
              setIsAuth(false);
              localStorage.removeItem('royal_user_id');
          }
          return true;
      } catch (error: any) {
          throw error;
      }
  };

  // Background Refresh
  const fetchData = async () => {
      try {
          const data = await api.getInitialState(state.currentUser);
          setState(prev => ({
              ...prev,
              ...data,
              currentUser: data.currentUser 
          }));
          
          if (state.currentUser && !data.currentUser) {
              setIsAuth(false);
              localStorage.removeItem('royal_user_id');
          }
          setConnectionError(false);
      } catch (error) {
          console.error("Failed to fetch data:", error);
          if (!connectionError && !state.products.length) setConnectionError(true);
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
            try {
                restoredUser = { id: storedUserId } as User;
                setIsAuth(true); 
            } catch (err) {
                localStorage.removeItem('royal_user_id');
            }
        }

        try {
            // Step 1: Wake up server (Fast 1s polling)
            await waitForServer();
            setIsWakingUp(false);
            
            // Step 2: Fetch Data (Once server is up, this should be fast)
            await loadData(restoredUser);
            setConnectionError(false);
        } catch (error: any) {
            console.error("Init failed:", error);
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
      const intervalTime = isAdmin ? 10000 : 30000; 

      const interval = setInterval(() => {
          if (state.currentUser && state.currentUser.id) {
            fetchData();
          }
      }, intervalTime); 
      return () => clearInterval(interval);
  }, [isAuth, state.currentUser?.role, state.currentUser?.id]);

  // ... (Keep existing handlers for login, register, etc.) ...
  const handleLogin = async (email: string, password: string) => {
      try {
          const user = await api.login(email, password);
          if (!user || !user.id || user.id === 'undefined') {
              throw new Error("Login failed: Invalid server response (Missing ID)");
          }
          localStorage.setItem('royal_user_id', user.id);
          setState(prev => ({ ...prev, currentUser: user }));
          setIsAuth(true);
          showToast(`Welcome back, ${user.username}!`, 'success');
          fetchData();
          if (user.role === 'admin') setActiveTab('admin');
          else setActiveTab('dashboard');
      } catch (err: any) {
          throw new Error(err.message || 'Login failed');
      }
  };

  const handleRegister = async (data: any) => {
      try {
          const user = await api.register(data);
          if (!user || !user.id || user.id === 'undefined') {
              throw new Error("Registration failed: Invalid server response (Missing ID)");
          }
          localStorage.setItem('royal_user_id', user.id);
          setState(prev => ({ ...prev, currentUser: user }));
          setIsAuth(true);
          setActiveTab('dashboard');
          showToast('Registration successful! Welcome to Royal Hub.', 'success');
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
    showToast('Logged out successfully.', 'info');
  };

  const handleInvest = async (product: Product) => {
    if (!state.currentUser) return;
    try {
        await api.invest(state.currentUser.id, product.id);
        showToast(`Successfully invested in ${product.name}!`, 'success');
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
    if (!state.currentUser.id) {
        showToast("User session invalid. Please re-login.", "error");
        return;
    }
    try {
        await api.recharge(state.currentUser.id, amount);
        showToast('Recharge submitted! Pending Admin approval.', 'success');
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

  const handleAddProduct = async (product: Product) => {
    try {
        await api.addProduct(product);
        showToast('Product added successfully', 'success');
        await fetchData();
    } catch (err: any) {
        showToast(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
      try {
        await api.deleteProduct(id);
        showToast('Product deleted', 'info');
        await fetchData();
      } catch (err: any) {
          showToast(err.message, 'error');
      }
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
      try {
        await api.updateSettings(newSettings);
        showToast('System settings updated', 'success');
        await fetchData();
      } catch (err: any) {
          showToast(err.message, 'error');
      }
  };

  const handleUpdateAdminCredentials = (email: string, password: string) => {
    if (!state.currentUser) return;
    handleAdminUpdateUser(state.currentUser.id, { email, password });
  };

  const handleAdminUpdateUser = async (userId: string, updates: Partial<User>) => {
      try {
        await api.updateUser(userId, updates);
        showToast('User updated successfully.', 'success');
        await fetchData();
      } catch (err: any) {
          showToast(err.message, 'error');
      }
  };

  const handleApproveRecharge = async (userId: string, txId: string) => {
      try {
        await api.handleTransaction(userId, txId, 'approve');
        showToast('Recharge approved.', 'success');
        await fetchData();
      } catch (err: any) {
          showToast(err.message, 'error');
      }
  };

  const handleRejectRecharge = async (userId: string, txId: string) => {
      try {
        await api.handleTransaction(userId, txId, 'reject');
        showToast('Recharge rejected.', 'info');
        await fetchData();
      } catch (err: any) {
          showToast(err.message, 'error');
      }
  };

  const handleApproveWithdrawal = async (userId: string, txId: string) => {
      try {
        await api.handleTransaction(userId, txId, 'approve');
        showToast('Withdrawal approved.', 'success');
        await fetchData();
      } catch (err: any) {
          showToast(err.message, 'error');
      }
  };

  const handleRejectWithdrawal = async (userId: string, txId: string) => {
      try {
        await api.handleTransaction(userId, txId, 'reject');
        showToast('Withdrawal rejected and refunded.', 'info');
        await fetchData();
      } catch (err: any) {
          showToast(err.message, 'error');
      }
  };

  const handleResetData = async () => {
      try {
        await api.resetData();
        showToast('System Factory Reset Complete.', 'success');
        setIsAuth(false);
        localStorage.removeItem('royal_user_id');
        setState(prev => ({ ...prev, currentUser: null, users: [], products: [] }));
      } catch (err: any) {
          showToast(err.message, 'error');
      }
  };

  const handleRetryConnection = () => {
      setIsLoading(true);
      setConnectionError(false);
      setWakeUpAttempt(0);
      setErrorMessage('');
      
      const storedUserId = localStorage.getItem('royal_user_id');
      const mockUser = storedUserId ? { id: storedUserId } as User : null;
      
      // Retry whole init process
      waitForServer()
        .then(() => loadData(mockUser))
        .then(() => setConnectionError(false))
        .catch((e) => {
            setConnectionError(true);
            setErrorMessage(e.message);
        })
        .finally(() => setIsLoading(false));
  };


  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#2c1810] p-4">
              <div className="text-center text-white bg-[#4a2c20] p-8 rounded-xl shadow-2xl max-w-sm w-full border border-amber-900/50">
                  <div className="relative mb-6">
                      <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 rounded-full"></div>
                      <Loader2 size={48} className="animate-spin mx-auto text-amber-500 relative z-10" />
                  </div>
                  <h2 className="text-xl font-bold mb-3 tracking-wide">Connecting to Royal Hub</h2>
                  
                  {isWakingUp ? (
                      <div className="space-y-3">
                          <p className="text-amber-100/70 text-sm">
                             Waking up backend server...
                          </p>
                          <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-amber-500 h-full rounded-full animate-pulse w-2/3"></div>
                          </div>
                          <div className="bg-black/20 rounded-lg p-2 animate-fadeIn flex items-center justify-center gap-2">
                               <Activity size={14} className="text-amber-400 animate-pulse" />
                               <span className="text-xs text-amber-400 font-mono">Attempt {wakeUpAttempt} / 90</span>
                          </div>
                      </div>
                  ) : (
                       <p className="text-amber-100/70 text-sm">
                          Loading your dashboard...
                       </p>
                  )}
              </div>
          </div>
      );
  }

  if (connectionError && !isAuth) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#2c1810] p-6">
              <div className="text-center bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full animate-bounce-in">
                  <div className="bg-red-50 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <AlertTriangle size={40} className="text-red-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Connection Failed</h2>
                  <p className="text-gray-600 mb-4 text-sm">
                      Could not connect to the Royal Hub Backend.
                  </p>
                  
                  {errorMessage && (
                      <div className="bg-red-50 p-2 rounded mb-4 border border-red-100">
                          <p className="text-xs text-red-600 font-mono break-all">{errorMessage}</p>
                      </div>
                  )}

                  <div className="bg-gray-100 p-3 rounded mb-6 border border-gray-200 text-left">
                      <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Target URL</p>
                      <p className="text-xs text-gray-800 font-mono break-all bg-white p-1 rounded border border-gray-200">
                          {api.getBaseUrl()}
                      </p>
                  </div>
                  <button 
                    onClick={handleRetryConnection}
                    className="w-full bg-amber-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-amber-700 transition-colors shadow-lg flex items-center justify-center"
                  >
                      <RefreshCw size={18} className="mr-2" /> Retry Connection
                  </button>
              </div>
          </div>
      );
  }

  return (
    <>
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
            <Auth onLogin={handleLogin} onRegister={handleRegister} />
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
             {activeTab === 'about' && (
                <About />
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