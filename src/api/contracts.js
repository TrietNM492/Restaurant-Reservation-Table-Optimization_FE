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
        throw new Error('Invalid table pagination data received from server.');
      }
      if (!Array.isArray(pageData.result)) {
        throw new Error('Table list data is not an array.');
      }
      if (!pageData.meta || typeof pageData.meta !== 'object') {
        throw new Error('Missing pagination metadata (meta) from server.');
      }
      if (typeof pageData.meta.hasNext !== 'boolean') {
        throw new Error('Invalid hasNext property in pagination metadata.');
      }

      allTables = allTables.concat(pageData.result);
      hasNextPage = pageData.meta.hasNext;
      currentPage++;
    }

    return allTables;
  },
};
