import React from 'react';
import { LogOut, Home, Wallet, PieChart, ShieldCheck, Users, Info, Bell } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isAdmin: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onLogout, isAdmin }) => {
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'invest', icon: PieChart, label: 'Market' },
    { id: 'referral', icon: Users, label: 'Affiliate' },
    { id: 'wallet', icon: Wallet, label: 'Wallet' },
    { id: 'about', icon: Info, label: 'About' },
  ];

  return (
    <div className="min-h-screen bg-[#1a0f0a] text-white flex flex-col font-sans">
      {/* Premium Header */}
      <header className="bg-[#2c1810]/90 backdrop-blur-md sticky top-0 z-50 border-b border-amber-900/30 pt-safe">
        <div className="max-w-md mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-700 rounded-xl flex items-center justify-center text-[#1a0f0a] font-black text-xl shadow-[0_0_20px_rgba(251,191,36,0.3)] group-active:scale-95 transition-transform">
              R
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tighter uppercase leading-none text-amber-500">
                {isAdmin ? 'System Core' : 'Royal Hub'}
              </h1>
              <p className="text-[10px] text-amber-200/50 font-bold uppercase tracking-widest mt-0.5">
                {isAdmin ? 'Root Access' : 'Premium Wealth'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isAdmin && (
              <button className="p-2 text-amber-200/50 hover:text-amber-500 transition-colors">
                <Bell size={20} />
              </button>
            )}
            <button 
              onClick={onLogout}
              className="p-2 bg-amber-500/10 text-amber-500 rounded-xl active:bg-amber-500 active:text-[#1a0f0a] transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-x-hidden ${!isAdmin ? 'pb-safe' : ''}`}>
        <div className="max-w-md mx-auto px-4 py-6 animate-bounce-in">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Optimized for Mobile) */}
      {!isAdmin && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#2c1810]/95 backdrop-blur-lg border-t border-amber-900/30 z-40 pb-[var(--safe-bottom)]">
            <div className="max-w-md mx-auto flex justify-around px-2">
            {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex-1 py-3 flex flex-col items-center justify-center space-y-1 transition-all relative ${
                    isActive ? 'text-amber-500' : 'text-amber-200/30'
                    }`}
                >
                    {isActive && (
                      <div className="absolute top-0 w-8 h-1 bg-amber-500 rounded-full blur-[2px]" />
                    )}
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} className={isActive ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : ''} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                </button>
                );
            })}
            </div>
        </nav>
      )}
    </div>
  );
};