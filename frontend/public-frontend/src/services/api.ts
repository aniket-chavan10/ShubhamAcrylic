import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

export const getProducts = async () => {
    const response = await api.get('/products');
    return response.data;
};

export const createEnquiry = async (enquiryData: any) => {
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

export default api;
