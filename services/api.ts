
import { AppState, Product, User, AppSettings, Transaction } from '../types';

// PRODUCTION SETUP:
// When deploying to Vercel/Netlify, you MUST add an Environment Variable named 'VITE_API_URL'.
// Value should be your deployed backend URL (e.g., https://royal-hub-backend.onrender.com/api).
// If not set, it defaults to localhost for development.
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

// Helper for Fetch
const request = async (endpoint: string, options: RequestInit = {}) => {
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "API Request Failed");
        }
        return res.json();
    } catch (error: any) {
        console.error(`API Error at ${API_URL}${endpoint}:`, error);
        
        // Custom error message for connection refusal (Server down)
        if (error.message === 'Failed to fetch') {
            throw new Error("Cannot connect to server. Is 'npm run server' running?");
        }
        throw error;
    }
};

export const api = {
    // Auth
    login: (email: string, password: string) => request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    }),
    
    register: (data: any) => request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    // Data Fetching
    getInitialState: async (currentUser: User | null): Promise<AppState> => {
        // Fetch products and settings publically
        const products = await request('/products');
        const settings = await request('/admin/settings');
        
        let users: User[] = [];
        let refreshedUser = null;

        if (currentUser) {
            // If logged in, refresh user data
            try {
                refreshedUser = await request(`/users/${currentUser.id}`);
                
                // If Admin, fetch all users for dashboard
                if (currentUser.role === 'admin') {
                    users = await request('/admin/users');
                } else {
                    users = [refreshedUser];
                }
            } catch (e) {
                // If user fetch fails (e.g. deleted from DB), log them out conceptually by returning null
                console.warn("Failed to refresh user session", e);
            }
        }

        return {
            currentUser: refreshedUser,
            products,
            users,
            settings
        };
    },

    // User Actions
    getUser: (userId: string) => request(`/users/${userId}`),

    invest: (userId: string, productId: string) => request('/users/invest', {
        method: 'POST',
        body: JSON.stringify({ userId, productId })
    }),

    claim: (userId: string) => request('/users/claim', {
        method: 'POST',
        body: JSON.stringify({ userId })
    }),

    recharge: (userId: string, amount: number) => request('/transactions', {
        method: 'POST',
        body: JSON.stringify({ userId, type: 'recharge', amount })
    }),

    withdraw: (userId: string, amount: number, details: any) => request('/transactions', {
        method: 'POST',
        body: JSON.stringify({ userId, type: 'withdrawal', amount, withdrawalDetails: details })
    }),

    // Admin Actions
    addProduct: (product: Product) => request('/products', {
        method: 'POST',
        body: JSON.stringify(product)
    }),

    deleteProduct: (id: string) => request(`/products/${id}`, {
        method: 'DELETE'
    }),

    updateSettings: (settings: AppSettings) => request('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
    }),

    handleTransaction: (userId: string, txId: string, action: 'approve' | 'reject') => 
        request(`/admin/transaction/${userId}/${txId}`, {
            method: 'POST',
            body: JSON.stringify({ action })
        }),

    updateUser: (userId: string, updates: any) => request(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    }),
    
    resetData: () => request('/admin/reset', { method: 'POST' })
};
