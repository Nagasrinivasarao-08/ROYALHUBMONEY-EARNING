import { AppState, Product, User, AppSettings } from '../types';

const STORAGE_KEY = 'investflow_db_v3_royal';

// Products based on the Royal series
const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'ROYAL-1300',
    description: 'Entry level Royal Hub container store investment.',
    price: 1300,
    dailyIncome: 16.9,
    totalRevenue: 2535,
    days: 150,
    purchaseLimit: 2,
    image: 'https://images.unsplash.com/photo-1493857671505-72967e2e2760?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: '2',
    name: 'ROYAL-3200',
    description: 'Standard Royal Hub franchise unit with higher daily returns.',
    price: 3200,
    dailyIncome: 44.8,
    totalRevenue: 8064,
    days: 180,
    purchaseLimit: 2,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: '3',
    name: 'ROYAL-6400',
    description: 'Premium Royal Hub location store investment.',
    price: 6400,
    dailyIncome: 96,
    totalRevenue: 23040,
    days: 240,
    purchaseLimit: 2,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: '4',
    name: 'ROYAL-12800',
    description: 'Regional flagship store share.',
    price: 12800,
    dailyIncome: 217.6,
    totalRevenue: 65280,
    days: 300,
    purchaseLimit: 2,
    image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: '5',
    name: 'ROYAL-25600',
    description: 'Full year high-yield investment plan.',
    price: 25600,
    dailyIncome: 460.8,
    totalRevenue: 168192,
    days: 365,
    purchaseLimit: 2,
    image: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: '6',
    name: 'ROYAL-38600',
    description: 'Executive partner level investment.',
    price: 38600,
    dailyIncome: 772,
    totalRevenue: 281780,
    days: 365,
    purchaseLimit: 2,
    image: 'https://images.unsplash.com/photo-1463797221720-6b07e6426c24?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: '7',
    name: 'ROYAL-62600',
    description: 'Supreme shareholder package.',
    price: 62600,
    dailyIncome: 1377.2,
    totalRevenue: 502678,
    days: 365,
    purchaseLimit: 1,
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800&auto=format&fit=crop'
  }
];

const INITIAL_SETTINGS: AppSettings = {
  upiId: 'pay@royal',
  qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=pay@royal&pn=RoyalInvest&cu=INR', // Default fallback
  referralBonusPercentage: 10,
  withdrawalFeePercentage: 5
};

const DEFAULT_ADMIN: User = {
  id: 'admin-001',
  username: 'Admin',
  email: 'srinivas@gmail.com',
  password: 'srinivas@9121',
  role: 'admin',
  balance: 100000,
  referralCode: 'ADMIN',
  investments: [],
  transactions: [],
  registeredAt: new Date().toISOString()
};

export const loadState = (): AppState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    
    // Ensure settings are merged with defaults
    const mergedSettings = { ...INITIAL_SETTINGS, ...parsed.settings };

    // Basic migration and safety check
    let currentUsers = parsed.users || [];
    
    // Check if an admin already exists in the stored data
    // We look for the specific admin email to upgrade permissions if needed
    const adminIndex = currentUsers.findIndex((u: User) => u.email === DEFAULT_ADMIN.email);
    
    if (adminIndex !== -1) {
        // Force admin role and password for the owner account to ensure access
        currentUsers[adminIndex] = {
            ...currentUsers[adminIndex],
            role: 'admin',
            // We don't overwrite password here to allow changes, 
            // but we ensure the role is correct.
        };
    } else {
        // Inject default admin if missing
        currentUsers.push(DEFAULT_ADMIN);
    }

    return { 
        ...parsed, 
        users: currentUsers,
        products: parsed.products || INITIAL_PRODUCTS,
        settings: mergedSettings 
    };
  }
  
  // No data found, return initial state
  return {
    currentUser: null,
    users: [DEFAULT_ADMIN],
    products: INITIAL_PRODUCTS,
    settings: INITIAL_SETTINGS
  };
};

export const saveState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const clearState = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const resetData = () => {
    localStorage.removeItem(STORAGE_KEY);
    return {
        currentUser: null,
        users: [DEFAULT_ADMIN],
        products: INITIAL_PRODUCTS,
        settings: INITIAL_SETTINGS
    };
};