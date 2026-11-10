import api from '../api/axios.js';
import { unwrapData } from '../utils/unwrapData.js';

const getErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message;
  return typeof message === 'string' && message.trim()
    ? message
    : error?.message || fallback;
};

const throwServiceError = (error, fallback) => {
  const serviceError = new Error(getErrorMessage(error, fallback), { cause: error });
  serviceError.response = error?.response;
  throw serviceError;
};

export const userService = {
  getProfile: async () => {
    try {
      return unwrapData(await api.get('/users/me'));
    } catch (error) {
      throwServiceError(error, 'Unable to load your profile.');
    }
  },

  updateProfile: async (payload) => {
    try {
      return unwrapData(await api.put('/users/me', payload));
    } catch (error) {
      throwServiceError(error, 'Unable to update your profile.');
    }
  },

  changeAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatarUrl', file);

    try {
      return unwrapData(await api.post('/users/change-avatar', formData));
    } catch (error) {
      throwServiceError(error, 'Unable to update your profile photo.');
    }
  },
};
