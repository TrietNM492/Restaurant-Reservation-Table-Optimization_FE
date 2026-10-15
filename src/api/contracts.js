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

export const reservationApi = {
  create: async (payload) => {
    const response = await api.post('/reservations', payload).catch((error) => {
      const message = error.response?.data?.message ?? 'Unable to create reservation.';
      throw new Error(typeof message === 'string' ? message : 'Unable to create reservation.');
    });

    return unwrapData(response);
  },

  listMine: async () => {
    const response = await api.get('/reservations/me');
    return unwrapData(response);
  },
};
