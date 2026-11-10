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





export const reservationApi = {
    create: async (payload) => {
        try {
            const response = await api.post('/reservations', payload);
            return unwrapData(response);
        } catch (error) {
            const message = extractErrorMessage(error, 'Unable to create reservation.');
            const customError = new Error(message, { cause: error });
            if (error?.response?.data?.message && typeof error.response.data.message === 'object') {
                customError.fieldErrors = error.response.data.message;
            }
            customError.response = error?.response;
            throw customError;
        }
    },

    update: async (id, payload) => {
        try {
            const response = await api.put(`/reservations/${id}`, payload);
            return unwrapData(response);
        } catch (error) {
            const message = extractErrorMessage(error, 'Unable to update reservation.');
            const customError = new Error(message, { cause: error });
            if (error?.response?.data?.message && typeof error.response.data.message === 'object') {
                customError.fieldErrors = error.response.data.message;
            }
            customError.response = error?.response;
            throw customError;
        }
    },

    listMine: async () => {
        try {
            const response = await api.get('/reservations/me');
            return unwrapData(response);
        } catch (error) {
            const message = extractErrorMessage(error, 'Unable to load reservations.');
            const customError = new Error(message, { cause: error });
            customError.response = error?.response;
            throw customError;
        }
    },

    cancel: async (id) => {
        try {
            const response = await api.post(`/reservations/${id}/cancel`);
            return unwrapData(response);
        } catch (error) {
            const message = extractErrorMessage(error, 'Unable to cancel reservation.');
            const customError = new Error(message, { cause: error });
            if (error?.response?.data?.message && typeof error.response.data.message === 'object') {
                customError.fieldErrors = error.response.data.message;
            }
            customError.response = error?.response;
            throw customError;
        }
    },

    checkIn: async (id) => {
        try {
            const response = await api.post(`/reservations/${id}/check-in`);
            return unwrapData(response);
        } catch (error) {
            const message = extractErrorMessage(error, 'Unable to check in reservation.');
            const customError = new Error(message, { cause: error });
            if (error?.response?.data?.message && typeof error.response.data.message === 'object') {
                customError.fieldErrors = error.response.data.message;
            }
            customError.response = error?.response;
            throw customError;
        }
    },

    complete: async (id) => {
        try {
            const response = await api.post(`/reservations/${id}/complete`);
            return unwrapData(response);
        } catch (error) {
            const message = extractErrorMessage(error, 'Unable to complete reservation.');
            const customError = new Error(message, { cause: error });
            if (error?.response?.data?.message && typeof error.response.data.message === 'object') {
                customError.fieldErrors = error.response.data.message;
            }
            customError.response = error?.response;
            throw customError;
        }
    },

    adminList: async (params = {}) => {
        try {
            const { page = 0, size = 10, q = '', status = '', type = '', from = '', to = '' } = params;
            const query = { page, size };
            if (q && q.trim()) query.q = q.trim();
            if (status) query.status = status;
            if (type) query.type = type;
            if (from) query.from = from;
            if (to) query.to = to;
            const response = await api.get('/reservations', { params: query });
            return unwrapData(response);
        } catch (error) {
            const message = extractErrorMessage(error, 'Unable to load reservations.');
            const customError = new Error(message, { cause: error });
            customError.response = error?.response;
            throw customError;
        }
    },

    confirm: async (id) => {
        try {
            const response = await api.post(`/reservations/${id}/confirm`);
            return unwrapData(response);
        } catch (error) {
            const message = extractErrorMessage(error, 'Unable to confirm reservation.');
            const customError = new Error(message, { cause: error });
            if (error?.response?.data?.message && typeof error.response.data.message === 'object') {
                customError.fieldErrors = error.response.data.message;
            }
            customError.response = error?.response;
            throw customError;
        }
    },

    reject: async (id, reason) => {
        try {
            const payload = (typeof reason === 'string' && reason.trim()) ? { reason: reason.trim() } : {};
            const response = await api.post(`/reservations/${id}/reject`, payload);
            return unwrapData(response);
        } catch (error) {
            const message = extractErrorMessage(error, 'Unable to reject reservation.');
            const customError = new Error(message, { cause: error });
            if (error?.response?.data?.message && typeof error.response.data.message === 'object') {
                customError.fieldErrors = error.response.data.message;
            }
            customError.response = error?.response;
            throw customError;
        }
    },
};

