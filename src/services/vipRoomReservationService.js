import api from "../api/axios.js";
import {unwrapData} from "../utils/unwrapData.js";


const extractErrorMessage = (error, fallback = 'Unable to complete reservation request.') => {
    const data = error?.response?.data;
    if (typeof data?.message === 'string' && data.message.trim()) {
        return data.message;
    }
    if (Array.isArray(data?.message)) {
        return data.message
            .map((item) => (typeof item === 'string' ? item : item?.message || JSON.stringify(item)))
            .filter(Boolean)
            .join('; ');
    }
    if (data?.message && typeof data.message === 'object') {
        const fieldErrors = Object.entries(data.message)
            .map(([field, msg]) => (typeof msg === 'string' ? `${field}: ${msg}` : `${field}: ${JSON.stringify(msg)}`))
            .filter(Boolean);
        if (fieldErrors.length > 0) {
            return fieldErrors.join('; ');
        }
    }
    if (typeof data?.error === 'string' && data.error.trim()) {
        return data.error;
    }
    if (typeof error?.message === 'string' && error.message.trim()) {
        return error.message;
    }
    return fallback;
};


export const roomReservationApi = {
    booking: async (payload) => {
        try {
            const response = await api.post('/room-reservation/booking', payload);
            return unwrapData(response);
        } catch (error) {
            const message = extractErrorMessage(error, 'Unable to create VIP room reservation.');
            const customError = new Error(message, { cause: error });
            if (error?.response?.data?.message && typeof error.response.data.message === 'object') {
                customError.fieldErrors = error.response.data.message;
            }
            customError.response = error?.response;
            throw customError;
        }
    },

    getRecommendations: async (params) => {
        try {
            const response = await api.get('/room-reservation/recommendation', { params });
            return unwrapData(response);
        } catch (error) {
            const message = extractErrorMessage(error, 'Unable to fetch VIP room recommendations.');
            const customError = new Error(message, { cause: error });
            if (error?.response?.data?.message && typeof error.response.data.message === 'object') {
                customError.fieldErrors = error.response.data.message;
            }
            customError.response = error?.response;
            throw customError;
        }
    },
};

