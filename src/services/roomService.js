import api from "../api/axios.js";
import {unwrapData} from "../utils/unwrapData.js";


export const roomApi = {
    getVipRooms: async () => {
        try {
            const response = await api.get('/rooms/type/VIP_ROOM');
            return unwrapData(response);
        } catch (error) {
            const message = extractErrorMessage(error, 'Unable to fetch VIP rooms.');
            throw new Error(message, { cause: error });
        }
    },

    getAvailableRooms: async () => {
        try {
            const response = await api.get('/rooms/available');
            return unwrapData(response);
        } catch (error) {
            const message = extractErrorMessage(error, 'Unable to fetch available rooms.');
            throw new Error(message, { cause: error });
        }
    },

    getRoomById: async (id) => {
        try {
            const response = await api.get(`/rooms/${id}`);
            return unwrapData(response);
        } catch (error) {
            const message = extractErrorMessage(error, 'Unable to fetch room details.');
            throw new Error(message, { cause: error });
        }
    },
};


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

