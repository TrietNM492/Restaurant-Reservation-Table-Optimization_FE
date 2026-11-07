import api from '../api/axios.js';
import { unwrapData } from '../utils/unwrapData.js';

export const orderApi = {
  /**
   * Create a new dining order (Dine-in at table or Pre-order with reservation)
   * @param {Object} payload
   * @param {number} [payload.tableId] - Table ID for dine-in
   * @param {number} [payload.reservationId] - Reservation ID for pre-ordering
   * @param {number} [payload.customerInformationId]
   * @param {boolean} [payload.isVipRoom=false]
   * @param {Array<{menuItemId: number, quantity: number}>} payload.items
   * @returns {Promise<object>} OrderResponseDTO (includes kitchenStatus, estimatedReadyTime)
   */
  createOrder: async (payload) => {
    const response = await api.post('/orders/create', payload).catch((error) => {
      const message = error.response?.data?.message ?? 'Failed to create order.';
      throw new Error(typeof message === 'string' ? message : 'Failed to create order.', { cause: error });
    });
    return unwrapData(response);
  },

  /**
   * Get active order details and kitchen status for customer or order ID
   * @param {number} [orderId] - Specific order ID (optional)
   * @returns {Promise<object>} OrderResponseDTO
   */
  getOrderStatus: async (orderId) => {
    const params = orderId ? { orderId } : {};
    const response = await api.get('/orders/status', { params }).catch((error) => {
      const message = error.response?.data?.message ?? 'Unable to retrieve order status.';
      throw new Error(typeof message === 'string' ? message : 'Unable to retrieve order status.', { cause: error });
    });
    return unwrapData(response);
  },

  /**
   * Add a new item to an active order
   * @param {Object} payload
   * @param {number} payload.orderId
   * @param {number} payload.menuItemId
   * @param {number} payload.quantity
   * @returns {Promise<object>} OrderItemResponseDTO
   */
  addOrderItem: async (payload) => {
    const response = await api.post('/order-items', payload).catch((error) => {
      const message = error.response?.data?.message ?? 'Failed to add item to order.';
      throw new Error(typeof message === 'string' ? message : 'Failed to add item to order.', { cause: error });
    });
    return unwrapData(response);
  },

  /**
   * Update quantity of an existing order item
   * @param {number} itemId
   * @param {Object} payload
   * @param {number} payload.quantity
   * @returns {Promise<object>} OrderItemResponseDTO
   */
  updateOrderItem: async (itemId, payload) => {
    const response = await api.put(`/order-items/${itemId}`, payload).catch((error) => {
      const message = error.response?.data?.message ?? 'Failed to update order item.';
      throw new Error(typeof message === 'string' ? message : 'Failed to update order item.', { cause: error });
    });
    return unwrapData(response);
  },

  /**
   * Delete an order item from active order
   * @param {number} itemId
   * @returns {Promise<void>}
   */
  deleteOrderItem: async (itemId) => {
    const response = await api.delete(`/order-items/${itemId}`).catch((error) => {
      const message = error.response?.data?.message ?? 'Failed to delete order item.';
      throw new Error(typeof message === 'string' ? message : 'Failed to delete order item.', { cause: error });
    });
    return unwrapData(response);
  },

  /**
   * Fetch dining tables for table selection dropdown
   * @returns {Promise<Array>} List of tables with area info and status
   */
  getAvailableTables: async () => {
    const response = await api.get('/tables', { params: { size: 100 } }).catch((error) => {
      const message = error.response?.data?.message ?? 'Unable to fetch tables.';
      throw new Error(typeof message === 'string' ? message : 'Unable to fetch tables.', { cause: error });
    });
    const unwrapped = unwrapData(response);
    return unwrapped?.result ?? unwrapped?.content ?? (Array.isArray(unwrapped) ? unwrapped : []);
  },
};

export default orderApi;

