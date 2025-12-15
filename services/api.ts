import { AppState, Product, User, AppSettings, Transaction } from '../types';

// --- CONFIGURATION ---
export const DEFAULT_PRODUCTION_URL = 'https://royal-hub-backend.onrender.com/api';
export const LOCAL_API_URL = 'http://localhost:5000/api';

const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1'
);

const envApiUrl = (import.meta as any).env?.VITE_API_URL;

let baseUrl = envApiUrl;
if (!baseUrl) {
    baseUrl = isLocal ? LOCAL_API_URL : DEFAULT_PRODUCTION_URL;
}

if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
}

export const API_URL = baseUrl;

// --- API CLIENT HELPERS ---
const request = async (endpoint: string, options: RequestInit = {}) => {
    try {
        const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        
        // Add timestamp to prevent caching
        let url = `${API_URL}${safeEndpoint}`;
        if (!options.method || options.method === 'GET') {
            const separator = url.includes('?') ? '&' : '?';
            url = `${url}${separator}_t=${Date.now()}`;
        }

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const res = await fetch(url, { 
            ...options, 
            headers,
            mode: 'cors', 
            credentials: 'omit'
        });
        
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
        
        if (error.name === 'TypeError' && (error.message === 'Failed to fetch' || error.message.includes('NetworkError'))) {
            const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
            const targetIsHttp = API_URL.startsWith('http:');

            if (isHttps && targetIsHttp) {
                throw new Error(`Security Block: Mixed Content. You are using a secure site (HTTPS) but trying to connect to an insecure backend (${API_URL}). Browsers block this. Please update VITE_API_URL to use 'https://'.`);
            }

            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                throw new Error("No Internet Connection. Please check your network settings.");
            }

            throw new Error(`Connection Failed: Unable to reach the server at ${API_URL}. The server might be down, or 'Access-Control-Allow-Origin' CORS headers are missing.`);
        }
        
        throw error;
    }
};

export const api = {
    getBaseUrl: () => API_URL,
    
    // Health Check for Fast Wakeup
    checkHealth: () => request('/health', { method: 'GET' }),

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
                if (refreshedUser.role === 'admin') {
                    users = await request('/admin/users');
                } else {
                    users = [refreshedUser];
                }
            } catch (e) {
                console.warn("Session refresh failed:", e);
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

    deleteUser: (userId: string) => request(`/admin/users/${userId}`, {
        method: 'DELETE'
    }),
    
    resetData: () => request('/admin/reset', { method: 'POST' })
};