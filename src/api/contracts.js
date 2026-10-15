import api from './axios';
import { restaurants } from '../data/restaurants';
import { useAuthStore } from '../stores/useAuthStore';

const unwrapData = (payload) => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const { data } = payload;
    if (data && typeof data === 'object' && 'result' in data && 'meta' in data) {
      return data.result;
    }

    return data;
  }

  return payload;
};

const isApiAvailable = async () => {
  try {
    await api.get('/menus/categories', { timeout: 2500 });
    return true;
  } catch {
    return false;
  }
};

export const authApi = {
  register: async (payload) => {
    const response = await api.post('/auth/register', payload).catch((error) => {
      const message = error.response?.data?.message ?? 'Unable to create account.';
      throw new Error(typeof message === 'string' ? message : 'Unable to create account.');
    });

    return unwrapData(response);
  },

  login: async (payload) => {
    const response = await api.post('/auth/login', payload).catch((error) => {
      const message = error.response?.data?.message ?? 'Unable to sign in.';
      throw new Error(typeof message === 'string' ? message : 'Unable to sign in.');
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

export const menuApi = {
  getCategories: async () => {
    const available = await isApiAvailable();
    if (!available) {
      return [
        { id: 1, name: 'Fine Dining' },
        { id: 2, name: 'Asian Fusion' },
        { id: 3, name: 'Seafood' },
        { id: 4, name: 'Family Dining' },
      ];
    }

    const response = await api.get('/menus/categories');
    return unwrapData(response);
  },

  search: async (params = {}) => {
    const available = await isApiAvailable();
    if (!available) {
      return {
        meta: { page: 1, pageSize: 10, pages: 1, total: restaurants.length, hasNext: false, hasPrevious: false },
        result: restaurants.map((restaurant, index) => ({
          id: index + 1,
          itemName: restaurant.name,
          description: restaurant.description,
          price: 89 + index * 17,
          itemPicture: restaurant.image,
          categoryId: 1,
          categoryName: restaurant.cuisine,
        })),
      };
    }

    const response = await api.get('/menus', { params: { page: 1, size: 10, ...params } });
    return unwrapData(response);
  },
};

const extractErrorMessage = (error, fallback = 'Unable to create reservation.') => {
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
      const customError = new Error(message);
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
      const customError = new Error(message);
      if (error?.response?.data?.message && typeof error.response.data.message === 'object') {
        customError.fieldErrors = error.response.data.message;
      }
      customError.response = error?.response;
      throw customError;
    }
  },

  listMine: async () => {
    const response = await api.get('/reservations/me');
    return unwrapData(response);
  },

  cancel: async (id) => {
    try {
      const response = await api.post(`/reservations/${id}/cancel`);
      return unwrapData(response);
    } catch (error) {
      const message = extractErrorMessage(error, 'Unable to cancel reservation.');
      const customError = new Error(message);
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
      const customError = new Error(message);
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
      const customError = new Error(message);
      if (error?.response?.data?.message && typeof error.response.data.message === 'object') {
        customError.fieldErrors = error.response.data.message;
      }
      customError.response = error?.response;
      throw customError;
    }
  },
};

export const tableApi = {
  getAll: async () => {
    let currentPage = 0;
    const pageSize = 20;
    let allTables = [];
    let hasNextPage = true;

    while (hasNextPage) {
      const payload = await api.get('/tables', {
        params: { page: currentPage, size: pageSize },
      });

      const pageData = payload?.data;

      if (!pageData || typeof pageData !== 'object') {
        throw new Error('Dữ liệu phân trang nhận được từ máy chủ không hợp lệ.');
      }
      if (!Array.isArray(pageData.result)) {
        throw new Error('Dữ liệu danh sách bàn không phải là mảng.');
      }
      if (!pageData.meta || typeof pageData.meta !== 'object') {
        throw new Error('Thiếu thông tin phân trang (meta) từ máy chủ.');
      }
      if (typeof pageData.meta.hasNext !== 'boolean') {
        throw new Error('Thuộc tính hasNext trong dữ liệu phân trang không hợp lệ.');
      }

      allTables = allTables.concat(pageData.result);
      hasNextPage = pageData.meta.hasNext;
      currentPage++;
    }

    return allTables;
  },
};
