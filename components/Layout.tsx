
import React from 'react';
import { LogOut, Home, Wallet, PieChart, ShieldCheck, Users, Info } from 'lucide-react';

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
    { id: 'invest', icon: PieChart, label: 'Product' },
    { id: 'referral', icon: Users, label: 'Team' },
    { id: 'wallet', icon: Wallet, label: 'Mine' },
    { id: 'about', icon: Info, label: 'About' },
  ];

  if (isAdmin) {
      navItems.push({ id: 'admin', icon: ShieldCheck, label: 'Admin' });
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-gray-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-[#2c1810] text-white shadow-md sticky top-0 z-20 border-b border-[#4a2c20]">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-500 rounded-md flex items-center justify-center text-[#2c1810] font-bold text-xl">
              R
            </div>
            <span className="font-bold text-lg tracking-wide text-amber-500">Royal Invest</span>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 bg-[#f8f5f2]">
        <div className="max-w-md mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="max-w-md mx-auto flex justify-around">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            // Condensed padding/size for 5-6 items
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex-1 py-2 flex flex-col items-center justify-center space-y-0.5 transition-all duration-200 ${
                  isActive ? 'text-amber-600 bg-amber-50' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
