import { create } from "zustand";

export const useAuthStore = create((set) => ({
    isAuthenticated: false,
    user: null,
    accessToken: null,

    setAuth: (accessToken, user) =>
        set({
            isAuthenticated: true,
            accessToken,
            user,
        }),

    logout: () =>
        set({
            isAuthenticated: false,
            accessToken: null,
            user: null,
        }),
}))