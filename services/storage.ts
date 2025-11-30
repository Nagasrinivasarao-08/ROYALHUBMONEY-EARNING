import { AppState, Product, User, AppSettings } from '../types';

const STORAGE_KEY = 'investflow_db_v5_royal'; // Bumped version to v5 to clear old dummy data

// Start with NO products. Admin must add them.
const INITIAL_PRODUCTS: Product[] = [];

const INITIAL_SETTINGS: AppSettings = {
  upiId: '', // Empty by default
  qrCodeUrl: '', 
  referralBonusPercentage: 5,
  withdrawalFeePercentage: 5
};

const DEFAULT_ADMIN: User = {
  id: 'admin-001',
  username: 'Admin',
  email: 'srinivas@gmail.com',
  password: 'srinivas@9121',
  role: 'admin',
  balance: 0,
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
    const adminIndex = currentUsers.findIndex((u: User) => u.email === DEFAULT_ADMIN.email);
    
    if (adminIndex !== -1) {
        // Force admin role for the owner account to ensure access
        currentUsers[adminIndex] = {
            ...currentUsers[adminIndex],
            role: 'admin',
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