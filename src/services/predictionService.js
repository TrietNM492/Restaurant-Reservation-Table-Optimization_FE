import api from '../api/axios.js';
import { unwrapData } from '../utils/unwrapData.js';

export const predictionApi = {
  /**
   * Predict food preparation time and kitchen readiness (FR-044 & FR-045)
   * @param {Object} payload
   * @param {number} [payload.orderId] - Optional existing Order ID
   * @param {Array<{menuItemId: number, quantity: number}>} [payload.items] - List of items for pre-order
   * @param {boolean} [payload.isVip=false] - Whether order has VIP queue priority
   * @returns {Promise<object>} PreparationTimePredictionResponseDTO
   */
  predictPreparationTime: async (payload = {}) => {
    const response = await api.post('/predictions/preparation-time', payload, { skipAuth: true }).catch((error) => {
      const message = error.response?.data?.message ?? 'Failed to calculate food preparation time.';
      throw new Error(typeof message === 'string' ? message : 'Failed to calculate food preparation time.', { cause: error });
    });
    return unwrapData(response);
  },

  /**
   * Predict customer queue waiting time for table assignment
   * @param {Object} payload
   * @returns {Promise<object>}
   */
  calculateWaitingTime: async (payload = {}) => {
    const response = await api.post('/predictions/waiting-time', payload).catch((error) => {
      const message = error.response?.data?.message ?? 'Failed to estimate waiting time.';
      throw new Error(typeof message === 'string' ? message : 'Failed to estimate waiting time.', { cause: error });
    });
    return unwrapData(response);
  },
};

