import { create } from 'zustand';

const STORAGE_KEY = 'restaurant-dining-order';

const readInitialState = () => {
  if (typeof window === 'undefined') {
    return { items: [], selectedTableId: null, selectedReservationId: null, activeOrder: null };
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], selectedTableId: null, selectedReservationId: null, activeOrder: null };
    const parsed = JSON.parse(raw);
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      selectedTableId: parsed.selectedTableId ?? null,
      selectedReservationId: parsed.selectedReservationId ?? null,
      activeOrder: parsed.activeOrder ?? null,
    };
  } catch {
    return { items: [], selectedTableId: null, selectedReservationId: null, activeOrder: null };
  }
};

const persistState = (state) => {
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          items: state.items,
          selectedTableId: state.selectedTableId,
          selectedReservationId: state.selectedReservationId,
          activeOrder: state.activeOrder,
        })
      );
    } catch {
      // Ignore sessionStorage errors
    }
  }
};

export const useOrderStore = create((set) => ({
  ...readInitialState(),
  isDrawerOpen: false,

  setDrawerOpen: (open) => set({ isDrawerOpen: Boolean(open) }),

  setSelectedTableId: (tableId) => {
    set((state) => {
      const next = { ...state, selectedTableId: tableId ? Number(tableId) : null };
      persistState(next);
      return next;
    });
  },

  setSelectedReservationId: (reservationId) => {
    set((state) => {
      const next = { ...state, selectedReservationId: reservationId ? Number(reservationId) : null };
      persistState(next);
      return next;
    });
  },

  setActiveOrder: (order) => {
    set((state) => {
      const next = { ...state, activeOrder: order };
      persistState(next);
      return next;
    });
  },

  addItem: (menuItem, quantity = 1) => {
    set((state) => {
      const targetId = Number(menuItem.id || menuItem.menuItemId);
      const existingIndex = state.items.findIndex((i) => i.menuItemId === targetId);
      let updatedItems;
      if (existingIndex > -1) {
        updatedItems = state.items.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        const newItem = {
          menuItemId: targetId,
          itemName: menuItem.itemName || menuItem.name || 'Dish',
          itemPicture: menuItem.itemPicture || menuItem.picture || '',
          price: Number(menuItem.price || 0),
          quantity: Math.max(1, quantity),
          estimatedPrepMinutes: menuItem.estimatedPrepMinutes ?? null,
        };
        updatedItems = [...state.items, newItem];
      }
      const nextState = { ...state, items: updatedItems, isDrawerOpen: true };
      persistState(nextState);
      return nextState;
    });
  },

  updateQuantity: (menuItemId, quantity) => {
    set((state) => {
      let updatedItems;
      if (quantity <= 0) {
        updatedItems = state.items.filter((i) => i.menuItemId !== menuItemId);
      } else {
        updatedItems = state.items.map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity } : i
        );
      }
      const nextState = { ...state, items: updatedItems };
      persistState(nextState);
      return nextState;
    });
  },

  removeItem: (menuItemId) => {
    set((state) => {
      const updatedItems = state.items.filter((i) => i.menuItemId !== menuItemId);
      const nextState = { ...state, items: updatedItems };
      persistState(nextState);
      return nextState;
    });
  },

  clearDraft: () => {
    set((state) => {
      const next = { ...state, items: [] };
      persistState(next);
      return next;
    });
  },

  resetOrder: () => {
    set(() => {
      const next = {
        items: [],
        selectedTableId: null,
        selectedReservationId: null,
        activeOrder: null,
        isDrawerOpen: false,
      };
      persistState(next);
      return next;
    });
  },
}));

export default useOrderStore;

