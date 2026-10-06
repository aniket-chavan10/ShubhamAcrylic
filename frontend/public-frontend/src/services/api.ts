import axios from 'axios';
import type { Garment, PlacedOrder } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

/** Pull the server's error message out of an axios error */
export const errorMessage = (err: unknown, fallback = 'Something went wrong. Please try again.'): string => {
    if (axios.isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string } | undefined)?.message;
        if (msg) return msg;
        if (err.code === 'ECONNABORTED') return 'The request timed out. Please check your connection.';
    }
    return fallback;
};

export const getProducts = async () => {
    const response = await api.get('/products');
    return response.data;
};

export const createEnquiry = async (enquiryData: { name: string; email: string; mobileNo: string; message: string }) => {
    const response = await api.post('/enquiries', enquiryData);
    return response.data;
};

export const createProductEnquiry = async (enquiryData: {
    name: string;
    email: string;
    mobileNo: string;
    message: string;
    productId: number;
    productCode: string;
    productName: string;
}) => {
    const response = await api.post('/enquiries/product', enquiryData);
    return response.data;
};

export const getCategories = async () => {
    const response = await api.get('/categories');
    return response.data;
};

export const getSiteSettings = async () => {
    const response = await api.get('/settings');
    return response.data;
};

export const getBanners = async () => {
    const response = await api.get('/banners/public');
    return response.data;
};

// ── Design studio ────────────────────────────────────────────────────────────
export const getGarments = async (): Promise<Garment[]> => {
    const response = await api.get('/garments');
    return response.data;
};

export const sendEmailOtp = async (email: string): Promise<{ expiresIn: number }> => {
    const response = await api.post('/otp/send', { email });
    return response.data;
};

export const verifyEmailOtp = async (email: string, code: string): Promise<{ verificationToken: string }> => {
    const response = await api.post('/otp/verify', { email, code });
    return response.data;
};

export const placeOrder = async (form: FormData, verificationToken: string): Promise<PlacedOrder> => {
    const response = await api.post('/orders', form, {
        headers: { 'Content-Type': 'multipart/form-data', 'X-Verification-Token': verificationToken },
        timeout: 120000,
    });
    return response.data;
};

export default api;
