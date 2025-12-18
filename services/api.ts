import { AppState, Product, User, AppSettings } from '../types';

// --- CONFIGURATION ---
export const DEFAULT_PRODUCTION_URL = 'https://royal-hub-backend.onrender.com/api';
export const LOCAL_API_URL = 'http://localhost:5000/api';

const getBaseUrl = () => {
    if (typeof window === 'undefined') return LOCAL_API_URL;
    
    // Check for explicit environment variable first
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    if (envUrl) return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;

    // Auto-detect local vs production
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? LOCAL_API_URL : DEFAULT_PRODUCTION_URL;
};

export const API_URL = getBaseUrl();

// --- API CLIENT HELPERS ---
const request = async (endpoint: string, options: RequestInit = {}) => {
    const safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${API_URL}${safeEndpoint}`;
    
    // Bust cache for GET requests
    if (!options.method || options.method === 'GET') {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}_t=${Date.now()}`;
    }

    const currentUserId = typeof localStorage !== 'undefined' ? localStorage.getItem('royal_user_id') : '';

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-user-id': currentUserId || '',
        ...options.headers
    };

    try {
        const res = await fetch(url, { 
            ...options, 
            headers,
            mode: 'cors'
        });
        
        const contentType = res.headers.get("content-type");
        const responseBody = contentType?.includes("application/json") ? await res.json() : { message: await res.text() };
        
        if (!res.ok) {
            throw new Error(responseBody.message || responseBody.error || `Server Error: ${res.status}`);
        }

        return responseBody;
    } catch (error: any) {
        console.error(`Fetch error at ${endpoint}:`, error);
        if (error.name === 'TypeError') {
            throw new Error("Unable to reach Royal Hub Servers. Please check your internet or wait for server wakeup.");
        }
        throw error;
    }
};

export const api = {
    getBaseUrl: () => API_URL,
    checkHealth: () => request('/health'),
    login: (email: string, password: string) => request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    }),
    register: (data: any) => request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getInitialState: async (currentUser: User | null): Promise<AppState> => {
        const products = await request('/products');
        const settings = await request('/admin/settings');
        
        let users: User[] = [];
        let refreshedUser = null;

        if (currentUser?.id && currentUser.id !== 'undefined') {
            try {
                refreshedUser = await request(`/users/${currentUser.id}`);
                if (refreshedUser.role === 'admin') {
                    users = await request('/admin/users');
                } else {
                    users = [refreshedUser];
                }
            } catch (e) {
                refreshedUser = null; 
            }
        }

        return { currentUser: refreshedUser, products, users, settings };
    },
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
    addProduct: (product: Product) => request('/products', {
        method: 'POST',
        body: JSON.stringify(product)
    }),
    deleteProduct: (id: string) => request(`/products/${id}`, { method: 'DELETE' }),
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