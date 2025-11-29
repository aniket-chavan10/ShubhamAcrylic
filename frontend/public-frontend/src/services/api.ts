import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getProducts = async () => {
    const response = await api.get('/products');
    return response.data;
};

export const createEnquiry = async (enquiryData: any) => {
    const response = await api.post('/enquiries', enquiryData);
    return response.data;
};

export const getCategories = async () => {
    const response = await api.get('/categories');
    return response.data;
};

export default api;
