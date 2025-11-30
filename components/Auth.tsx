
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Check, X, AlertCircle, Shield, User as UserIcon, Lock, Users, Key } from 'lucide-react';

interface AuthProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (data: any) => Promise<void>;
  // users prop removed as we verify against server now
}

type AuthMode = 'login' | 'register' | 'admin';

export const Auth: React.FC<AuthProps> = ({ onLogin, onRegister }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [referralStatus, setReferralStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Check for referral code in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setMode('register');
      setFormData(prev => ({ ...prev, referralCode: ref }));
      // We can't validate immediately without an API call, so we leave it 'idle' or strictly 'valid' visually
      setReferralStatus('valid'); 
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        if (mode === 'login' || mode === 'admin') {
            await onLogin(formData.email, formData.password);
        } else {
            // Register
            if (!formData.username || !formData.email || !formData.password) {
                throw new Error('All fields are required');
            }
            if (formData.password !== formData.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            await onRegister({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                referralCode: formData.referralCode || undefined
            });
        }
    } catch (err: any) {
        setError(err.message || 'Authentication failed');
    } finally {
        setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setMode('admin');
    setFormData({
        ...formData,
        email: 'srinivas@gmail.com',
        password: 'srinivas@9121',
        username: '',
        confirmPassword: '',
        referralCode: ''
    });
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#2c1810] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-bounce-in">
        
        {/* Header Section */}
        <div className="bg-amber-600 p-6 text-center text-white relative overflow-hidden">
             <div className="relative z-10">
                <div className="w-12 h-12 bg-white rounded-lg mx-auto flex items-center justify-center mb-3 text-[#2c1810] text-2xl font-bold shadow-lg">
                    R
                </div>
                <h1 className="text-2xl font-bold">Royal Hub</h1>
                <p className="text-amber-100 text-xs mt-1">
                    {mode === 'admin' ? 'Secure Admin Portal' : 'Premium Investment Platform'}
                </p>
             </div>
             <div className="absolute top-0 left-0 w-full h-full bg-black/10"></div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200">
            <button 
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'login' ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Login
            </button>
            <button 
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'register' ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Register
            </button>
            <button 
                onClick={() => { setMode('admin'); setError(''); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center ${mode === 'admin' ? 'text-[#2c1810] border-b-2 border-[#2c1810] bg-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <Shield size={14} className="mr-1" /> Admin
            </button>
        </div>

        <div className="p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                {mode === 'login' && <><UserIcon size={20} className="mr-2 text-amber-600"/> User Login</>}
                {mode === 'register' && <><Users size={20} className="mr-2 text-amber-600"/> Create Account</>}
                {mode === 'admin' && <><Lock size={20} className="mr-2 text-[#2c1810]"/> Admin Access</>}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
                <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
                <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Enter your name"
                />
                </div>
            )}
            
            <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 outline-none ${mode === 'admin' ? 'focus:ring-gray-500' : 'focus:ring-amber-500'}`}
                placeholder="Enter email"
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
                <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 outline-none ${mode === 'admin' ? 'focus:ring-gray-500' : 'focus:ring-amber-500'}`}
                placeholder="Enter password"
                />
            </div>

            {mode === 'register' && (
                <>
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Confirm Password</label>
                    <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Confirm password"
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Referral Code (Optional)</label>
                    <div className="relative">
                        <input
                        type="text"
                        value={formData.referralCode}
                        onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                        className="w-full p-3 border rounded-lg focus:ring-2 outline-none border-gray-300 focus:ring-amber-500"
                        placeholder="Enter referral code"
                        />
                    </div>
                </div>
                </>
            )}

            {error && <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded animate-bounce-in">
                <p className="text-red-700 text-sm font-medium flex items-center">
                    <AlertCircle size={16} className="mr-2"/> {error}
                </p>
            </div>}

            <button
                type="submit"
                disabled={loading}
                className={`w-full text-white py-3 rounded-lg font-bold transition-colors uppercase tracking-wide shadow-lg mt-4 disabled:opacity-70 flex justify-center items-center ${
                    mode === 'admin' ? 'bg-[#2c1810] hover:bg-black' : 'bg-amber-600 hover:bg-amber-700'
                }`}
            >
                {loading ? <span className="animate-spin mr-2">⟳</span> : null}
                {mode === 'login' ? 'Login' : mode === 'register' ? 'Register Account' : 'Access Admin Panel'}
            </button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center">
                {mode === 'admin' ? (
                     <button 
                        onClick={fillAdminCredentials}
                        className="text-xs text-gray-400 hover:text-gray-800 flex items-center transition-colors"
                    >
                        <Shield size={12} className="mr-1" /> Use Demo Admin Credentials
                    </button>
                ) : (
                    <p className="text-xs text-gray-400">Secure 256-bit Encryption</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
