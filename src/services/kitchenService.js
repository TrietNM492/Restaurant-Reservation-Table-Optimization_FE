import api from "../api/axios.js";

const BASE_URL = "/kitchen";

export const ORDER_KITCHEN_STATUSES = [
  "PENDING",
  "COOKING",
  "DONE",
  "SERVCED",
  "CANCELED",
  "QUEUED",
  "PREPARING",
  "READY",
  "SERVED",
  "ON_HOLD",
  "CANCELLED",
  "REJECTED",
];

const normalizeKitchenOrders = (response) => {
  const orders = response?.data ?? response;
  if (!Array.isArray(orders)) return orders;

  return orders.map((order) => ({
    ...order,
    isVip: order.isVip ?? order.vip ?? false,
  }));
};

export const kitchenApi = {
  /**
   * Fetch kitchen orders list (Module 3: Kitchen Queue Tracking)
   * @param {object} params - { status, isVip, search }
   */
  getOrders: async (params = {}) => {
    const { status = "", isVip = "", search = "" } = params;
    const query = {};
    if (status) query.status = status;
    if (typeof isVip === "boolean") query.isVip = isVip;
    if (search && search.trim()) query.search = search.trim();

    const response = await api.get(`${BASE_URL}/orders`, { params: query });
    return normalizeKitchenOrders(response);
  },

  /**
   * Fetch detail of a specific kitchen order by ID
   * @param {number} id
   */
  getOrderById: async (id) => api.get(`${BASE_URL}/orders/${id}`),

  /**
   * Update kitchen order status (Module 2: Kitchen Status Update)
   * @param {number} id - Kitchen Order ID
   * @param {{ status: string, note?: string }} payload
   */
  updateOrderStatus: async (id, payload) =>
    api.put(`${BASE_URL}/orders/${id}/status`, payload),

  /**
   * Fetch kitchen load monitoring dashboard stats (FR-030)
   * Returns: { pendingOrdersCount, preparingOrdersCount, readyOrdersCount, totalActiveOrdersCount, averagePrepTimeMinutes, kitchenUtilizationPercent, orderCountByStatus }
   */
  getDashboard: async () => api.get(`${BASE_URL}/dashboard`),
};
