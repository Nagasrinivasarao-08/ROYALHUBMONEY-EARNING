
import { AppState, Product, User, AppSettings, Transaction } from '../types';

// PRODUCTION SETUP:
// We automatically detect if running locally or in production.
// If VITE_API_URL is set in environment variables, it takes priority.
// Otherwise, we fallback to localhost (dev) or the Render URL (prod).

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_URL = (import.meta as any).env?.VITE_API_URL || 
                (isLocal ? 'http://localhost:5000/api' : 'https://royal-hub-backend.onrender.com/api');

console.log("API Service Initialized. Target:", API_URL);

// Helper for Fetch
const request = async (endpoint: string, options: RequestInit = {}) => {
    try {
        // Add cache-busting headers to force fresh data
        const headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            ...options.headers
        };

        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        if (!res.ok) {
            let errorMessage = "API Request Failed";
            try {
                const err = await res.json();
                errorMessage = err.message || err.error || errorMessage;
            } catch (e) {
                errorMessage = `Server Error (${res.status}): ${res.statusText}`;
            }
            throw new Error(errorMessage);
        }
        return res.json();
    } catch (error: any) {
        console.error(`API Error at ${API_URL}${endpoint}:`, error);
        
        // Custom error message for connection refusal (Server down)
        if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
            throw new Error(`Cannot connect to server at ${API_URL}. Is the backend running?`);
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

        if (currentUser && currentUser.id && currentUser.id !== 'undefined' && currentUser.id !== 'null') {
            // If logged in, refresh user data
            try {
                refreshedUser = await request(`/users/${currentUser.id}`);
                
                // If Admin, fetch all users for dashboard
                // We double check the role from the FRESH user object, not the stale state
                if (refreshedUser.role === 'admin') {
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
    getUser: (userId: string) => {
        if (!userId || userId === 'undefined' || userId === 'null') {
            return Promise.reject(new Error("Invalid User ID"));
        }
        return request(`/users/${userId}`);
    },

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
