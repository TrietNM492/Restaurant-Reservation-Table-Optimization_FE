import api from "../api/axios.js";
import {useAuthStore} from "../stores/useAuthStore.js";
import {unwrapData} from "../utils/unwrapData.js";


export const authApi = {
    register: async (payload) => {
        const response = await api.post('/auth/register', payload).catch((error) => {
            const message = error.response?.data?.message ?? 'Unable to create account.';
            throw new Error(typeof message === 'string' ? message : 'Unable to create account.', { cause: error });
        });

        return unwrapData(response);
    },

    login: async (payload) => {
        const response = await api.post('/auth/login', payload).catch((error) => {
            const message = error.response?.data?.message ?? 'Unable to sign in.';
            throw new Error(typeof message === 'string' ? message : 'Unable to sign in.', { cause: error });
        });

        const data = unwrapData(response);
        if (data?.accessToken) {
            useAuthStore.getState().setAuth(data.accessToken, data.user ?? data.customer ?? null);
        }

        return data;
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            useAuthStore.getState().logout();
        }
    },
};