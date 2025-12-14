import { AppState, Product, User, AppSettings, Transaction } from '../types';

// --- CONFIGURATION ---
// IMPORTANT: Set VITE_API_URL in your Vercel Project Settings to your Render Backend URL
// Example: https://your-app-name.onrender.com/api
export const DEFAULT_PRODUCTION_URL = 'https://royal-hub-backend.onrender.com/api';
export const LOCAL_API_URL = 'http://localhost:5000/api';

// --- URL DETECTION LOGIC ---
const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1'
);

// 1. Try VITE_API_URL from Environment (Vercel)
const envApiUrl = (import.meta as any).env?.VITE_API_URL;

// 2. Determine Base URL
let baseUrl = envApiUrl;

if (!baseUrl) {
    baseUrl = isLocal ? LOCAL_API_URL : DEFAULT_PRODUCTION_URL;
}

// Remove trailing slash if present
if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
}

export const API_URL = baseUrl;

// Debug logging
if (typeof window !== 'undefined') {
    console.log("%c Royal Hub API Connection ", "background: #2c1810; color: #fbbf24; padding: 4px; border-radius: 4px;", {
        mode: isLocal ? "Development" : "Production",
        target: API_URL,
        source: envApiUrl ? "Environment Variable (VITE_API_URL)" : "Default Fallback"
    });
}

// --- API CLIENT HELPERS ---
const request = async (endpoint: string, options: RequestInit = {}) => {
    try {
        const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        
        // Cache Busting for GET requests
        let url = `${API_URL}${safeEndpoint}`;
        if (!options.method || options.method === 'GET') {
            const separator = url.includes('?') ? '&' : '?';
            url = `${url}${separator}_t=${Date.now()}`;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            ...options.headers
        };

        const res = await fetch(url, { ...options, headers });
        
        let responseBody;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            responseBody = await res.json();
        } else {
            responseBody = { message: await res.text() };
        }
        
        if (!res.ok) {
            const errorMessage = responseBody.message || responseBody.error || `Request failed with status ${res.status}`;
            throw new Error(errorMessage);
        }

        return responseBody;

    } catch (error: any) {
        console.error(`API Error at ${endpoint}:`, error);
        if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
            throw new Error(`Server Unreachable at ${API_URL}. If you are the admin, check if the Backend is deployed and running.`);
        }
        throw error;
    }
};

export const api = {
    getBaseUrl: () => API_URL,

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
        const products = await request('/products');
        const settings = await request('/admin/settings');
        
        let users: User[] = [];
        let refreshedUser = null;

        if (currentUser && currentUser.id && currentUser.id !== 'undefined' && currentUser.id !== 'null') {
            try {
                refreshedUser = await request(`/users/${currentUser.id}`);
                // Only fetch all users if logged in as admin
                if (refreshedUser.role === 'admin') {
                    users = await request('/admin/users');
                } else {
                    // For normal users, we don't need the full user list, saving bandwidth
                    users = [refreshedUser];
                }
            } catch (e) {
                console.warn("Session refresh failed:", e);
                // If fetching the user fails (e.g. deleted from DB), logout
                refreshedUser = null; 
            }
        }

        return {
            currentUser: refreshedUser,
            products,
            users,
            settings
        };
    },

    getUser: (userId: string) => {
        if (!userId || userId === 'undefined') return Promise.reject(new Error("Invalid User ID"));
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

    recharge: (userId: string, amount: number) => {
        if (!userId) return Promise.reject(new Error("User ID missing"));
        return request('/transactions', {
            method: 'POST',
            body: JSON.stringify({ userId, type: 'recharge', amount })
        });
    },

    withdraw: (userId: string, amount: number, details: any) => request('/transactions', {
        method: 'POST',
        body: JSON.stringify({ userId, type: 'withdrawal', amount, withdrawalDetails: details })
    }),

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