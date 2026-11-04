import api from "../api/axios.js";
import { unwrapData } from "../utils/unwrapData.js";

const ADMIN_BASE = "/admin/rooms";

export const ROOM_TYPES = ["VIP_ROOM", "PRIVATE_ROOM", "TERRACE_ROOM"];

export const ROOM_STATUSES = [
  "AVAILABLE",
  "RESERVED",
  "PREPARING",
  "OCCUPIED",
  "CLEANING",
  "MAINTENANCE",
];

export const adminRoomApi = {
  /**
   * Fetch paginated rooms list with search and filter
   * @param {object} params - { page, size, q, roomType, roomStatus }
   */
  getList: async (params = {}) => {
    const { page = 0, size = 10, q = "", roomType = "", roomStatus = "" } = params;
    const query = { page, size };
    if (q && q.trim()) query.q = q.trim();
    if (roomType) query.roomType = roomType;
    if (roomStatus) query.roomStatus = roomStatus;
    return api.get(ADMIN_BASE, { params: query });
  },

  /** Check if room name already exists */
  checkRoomNameExists: async (roomName, excludeId = null) => {
    if (!roomName || !roomName.trim()) return false;
    try {
      const res = await api.get(ADMIN_BASE, {
        params: { q: roomName.trim(), page: 0, size: 20 },
      });
      const payload = res?.data ?? res;
      const items =
        payload?.result ??
        payload?.content ??
        (Array.isArray(payload) ? payload : []);
      const target = roomName.trim().toLowerCase();
      return items.some(
        (r) =>
          r.roomName &&
          r.roomName.trim().toLowerCase() === target &&
          (!excludeId || r.id !== excludeId)
      );
    } catch {
      return false;
    }
  },

  /** Fetch room by id */
  getById: async (id) => api.get(`${ADMIN_BASE}/${id}`),

  /** Create room */
  create: async (payload) => api.post(ADMIN_BASE, payload),

  /** Update room */
  update: async (id, payload) => api.put(`${ADMIN_BASE}/${id}`, { ...payload, id }),

  /** Change room status */
  changeStatus: async (id, roomStatus) =>
    api.patch(`${ADMIN_BASE}/status`, { id, roomStatus }),

  /** Toggle room maintenance */
  toggleMaintenance: async (id) =>
    api.patch(`${ADMIN_BASE}/${id}/toggle-maintenance`),

  /** Delete room */
  remove: async (id) => api.delete(`${ADMIN_BASE}/${id}`),
};

export const roomApi = {
  getVipRooms: async () => {
    try {
      const response = await api.get("/rooms/type/VIP_ROOM");
      return unwrapData(response);
    } catch (error) {
      const message = extractErrorMessage(error, "Unable to fetch VIP rooms.");
      throw new Error(message, { cause: error });
    }
  },

  getAvailableRooms: async () => {
    try {
      const response = await api.get("/rooms/available");
      return unwrapData(response);
    } catch (error) {
      const message = extractErrorMessage(
        error,
        "Unable to fetch available rooms."
      );
      throw new Error(message, { cause: error });
    }
  },

  getRoomById: async (id) => {
    try {
      const response = await api.get(`/rooms/${id}`);
      return unwrapData(response);
    } catch (error) {
      const message = extractErrorMessage(
        error,
        "Unable to fetch room details."
      );
      throw new Error(message, { cause: error });
    }
  },
};

const extractErrorMessage = (
  error,
  fallback = "Unable to complete reservation request."
) => {
  const data = error?.response?.data;
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }
  if (Array.isArray(data?.message)) {
    return data.message
      .map((item) =>
        typeof item === "string" ? item : item?.message || JSON.stringify(item)
      )
      .filter(Boolean)
      .join("; ");
  }
  if (data?.message && typeof data.message === "object") {
    const fieldErrors = Object.entries(data.message)
      .map(([field, msg]) =>
        typeof msg === "string" ? `${field}: ${msg}` : `${field}: ${JSON.stringify(msg)}`
      )
      .filter(Boolean);
    if (fieldErrors.length > 0) {
      return fieldErrors.join("; ");
    }
  }
  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }
  return fallback;
};
