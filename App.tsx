
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
import { CheckCircle, AlertTriangle, XCircle, Info, Loader2 } from 'lucide-react';

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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [connectionError, setConnectionError] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000); // Increased duration slightly for better readability of long errors
  };

  // --- Data Fetching ---

  const fetchData = async () => {
      try {
          const data = await api.getInitialState(state.currentUser);
          setState(prev => ({
              ...prev,
              ...data,
              currentUser: data.currentUser || prev.currentUser
          }));
          setConnectionError(false);
      } catch (error) {
          console.error("Failed to fetch data:", error);
          if (!connectionError) setConnectionError(true);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
      const init = async () => {
        const storedUserId = localStorage.getItem('royal_user_id');
        let restoredUser = null;
        
        // Safety: Check if stored ID is strictly valid
        if (storedUserId && storedUserId !== 'undefined' && storedUserId !== 'null') {
            try {
                restoredUser = await api.getUser(storedUserId);
                setIsAuth(true);
                if (restoredUser.role === 'admin') setActiveTab('admin');
                showToast(`Welcome back, ${restoredUser.username}`, 'success');
            } catch (err) {
                console.warn("Session restore failed or invalid ID, clearing storage");
                localStorage.removeItem('royal_user_id');
            }
        } else {
            // Clean up corrupt storage
            if (localStorage.getItem('royal_user_id')) {
                console.log("Cleaning corrupt user ID from storage");
                localStorage.removeItem('royal_user_id');
            }
        }

        try {
            const data = await api.getInitialState(restoredUser);
            setState({ 
                ...data, 
                currentUser: restoredUser 
            });
            setConnectionError(false);
        } catch (error) {
            console.error("Init failed:", error);
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
      const intervalTime = isAdmin ? 2000 : 5000;

      const interval = setInterval(() => {
          // Strictly ensure we have a valid user ID before polling
          if (state.currentUser && state.currentUser.id && state.currentUser.id !== 'undefined') {
            fetchData();
          }
      }, intervalTime); 
      return () => clearInterval(interval);
  }, [isAuth, state.currentUser?.role, state.currentUser?.id]);

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
          
          if (user.role === 'admin') {
              setActiveTab('admin');
              await fetchData(); 
          } else {
              setActiveTab('dashboard');
          }
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
        // Now uses the specific message from backend (e.g. "Invalid amount")
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
        // Now uses the specific message from backend (e.g. "Insufficient balance")
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


  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#2c1810]">
              <div className="text-center text-white">
                  <Loader2 size={48} className="animate-spin mx-auto mb-4 text-amber-500" />
                  <p className="text-amber-100 font-medium">Connecting to Royal Hub Server...</p>
              </div>
          </div>
      );
  }

  if (connectionError && !isAuth) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#2c1810] p-6">
              <div className="text-center bg-white p-8 rounded-xl shadow-2xl max-w-sm">
                  <AlertTriangle size={64} className="mx-auto mb-4 text-red-500" />
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Connection Failed</h2>
                  <p className="text-gray-600 mb-6 text-sm">
                      Could not connect to the Royal Hub Backend. Please ensure the server is running.
                  </p>
                  <button 
                    onClick={() => { setIsLoading(true); fetchData(); }}
                    className="bg-amber-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-700 transition-colors"
                  >
                      Retry Connection
                  </button>
              </div>
          </div>
      );
  }

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
