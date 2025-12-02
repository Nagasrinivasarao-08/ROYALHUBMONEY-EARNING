

export type Role = 'user' | 'admin';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  dailyIncome: number;
  totalRevenue: number;
  days: number;
  image: string;
  purchaseLimit?: number;
}

export interface Investment {
  id: string;
  productId: string;
  purchaseDate: string; // ISO string
  lastClaimDate: string; // ISO string
  claimedAmount: number;
  productSnapshot?: Product;
}

export interface Transaction {
  id: string;
  type: 'recharge' | 'withdrawal' | 'income' | 'investment' | 'referral';
  amount: number;
  date: string;
  status: 'pending' | 'success' | 'failed' | 'rejected';
  userId?: string; // Link transaction to a specific user
  withdrawalDetails?: {
      method: 'upi' | 'bank';
      details: string; // The primary field
      info?: string;   // Backup field for compatibility
  };
}

export interface User {
  id: string;
  username: string; // Used as Name
  email: string;   // Used for Login
  password: string;
  role: Role;
  balance: number;
  referralCode: string;
  referredBy?: string;
  investments: Investment[];
  transactions: Transaction[];
  registeredAt: string;
}

export interface AppSettings {
  upiId: string;
  qrCodeUrl: string;
  referralBonusPercentage: number;
  withdrawalFeePercentage: number;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  products: Product[];
  settings: AppSettings;
}