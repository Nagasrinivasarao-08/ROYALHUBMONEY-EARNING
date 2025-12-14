import { AppState, Product, User, AppSettings, Transaction } from '../types';

// PRODUCTION SETUP:
// Detect if running on localhost for development
const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1'
);

// Determine API URL:
// 1. Get Env Var from Vite/Vercel
const envApiUrl = (import.meta as any).env?.VITE_API_URL;

// 2. Validate: If we are in Production (not isLocal), and the Env Var is "localhost", it is WRONG. Ignore it.
const isValidEnvUrl = envApiUrl && (isLocal || !envApiUrl.includes('localhost'));

// 3. Fallback to Render backend provided by user
// FIXED: Added '/api' to the production URL so it matches the server routes
let baseUrl = isValidEnvUrl 
    ? envApiUrl 
    : (isLocal ? 'http://localhost:5000/api' : 'https://royal-hub-backend.onrender.com/api');

// Remove trailing slash if present to avoid double slashes (e.g. .../api//products)
if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
}

export const API_URL = baseUrl;

// Debug logging for easier troubleshooting in Vercel logs
if (typeof window !== 'undefined') {
    console.log("Royal Hub API Config:", {
        environment: isLocal ? "Localhost" : "Production",
        targetUrl: API_URL,
        envVarFound: !!envApiUrl
    });
}

// Helper for Fetch
const request = async (endpoint: string, options: RequestInit = {}) => {
    try {
        // Ensure endpoint starts with /
        const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        
        // CACHE BUSTING: Add a timestamp to every GET request to prevent stale data
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

        const res = await fetch(url, {
            ...options,
            headers
        });
        
        // Attempt to parse JSON, but handle HTML/Text responses (common in 404s or Gateway errors)
        let responseBody;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            responseBody = await res.json();
        } else {
            responseBody = { message: await res.text() };
        }
        
        if (!res.ok) {
            // Prioritize specific error messages sent by backend
            const errorMessage = responseBody.message || responseBody.error || `Request failed with status ${res.status}`;
            throw new Error(errorMessage);
        }

        return responseBody;

    } catch (error: any) {
        console.error(`API Error at ${endpoint}:`, error);
        
        // Handle Network Errors (Server down, offline, CORS)
        if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
            throw new Error(`Server Unreachable. The backend may be sleeping or offline.`);
        }
        
        // Pass through the specific error message
        throw error;
    }
};

export const api = {
    // Helper to see what URL is being used (Required by App.tsx)
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
        // Fetch products and settings publicly
        const products = await request('/products');
        const settings = await request('/admin/settings');
        
        let users: User[] = [];
        let refreshedUser = null;

        // STRICT CHECK: Only attempt to fetch user if ID is valid string and NOT "undefined"
        if (currentUser && currentUser.id && currentUser.id !== 'undefined' && currentUser.id !== 'null') {
            try {
                // Refresh specific user data
                refreshedUser = await request(`/users/${currentUser.id}`);
                
                // If Admin, fetch ALL users immediately
                if (refreshedUser.role === 'admin') {
                    users = await request('/admin/users');
                } else {
                    users = [refreshedUser];
                }
            } catch (e) {
                console.warn("Session refresh failed:", e);
                // Return null user to trigger logout if session is invalid
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

    recharge: (userId: string, amount: number) => {
        if (!userId || userId === 'undefined') return Promise.reject(new Error("User ID missing"));
        return request('/transactions', {
            method: 'POST',
            body: JSON.stringify({ userId, type: 'recharge', amount })
        });
    },

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