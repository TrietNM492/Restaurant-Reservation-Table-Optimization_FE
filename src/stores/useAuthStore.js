import { create } from 'zustand';

const STORAGE_KEY = 'restaurant-auth';

const readStoredAuth = () => {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, accessToken: null, user: null };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { isAuthenticated: false, accessToken: null, user: null };
    }

    const parsed = JSON.parse(raw);
    return {
      isAuthenticated: Boolean(parsed.accessToken),
      accessToken: parsed.accessToken ?? null,
      user: parsed.user ?? null,
    };
  } catch {
    return { isAuthenticated: false, accessToken: null, user: null };
  }
};

export const useAuthStore = create((set) => ({
  ...readStoredAuth(),

  setAuth: (accessToken, user) => {
    const nextState = {
      isAuthenticated: true,
      accessToken,
      user,
    };

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    }

    set(nextState);
  },

  updateUser: (userUpdates) => {
    const user = { ...useAuthStore.getState().user, ...userUpdates };
    const nextState = { user };

    if (typeof window !== 'undefined') {
      const { accessToken, isAuthenticated } = useAuthStore.getState();
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ accessToken, isAuthenticated, user }),
      );
    }

    set(nextState);
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    set({
      isAuthenticated: false,
      accessToken: null,
      user: null,
    });
  },
}));