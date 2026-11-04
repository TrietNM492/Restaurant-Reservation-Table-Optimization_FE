import api from '../api/axios.js';
import { unwrapData } from '../utils/unwrapData.js';

export const dashboardApi = {
  /**
   * Fetch table utilization analytics dashboard
   * @param {Object} params
   * @param {string} [params.startDate] - YYYY-MM-DD
   * @param {string} [params.endDate] - YYYY-MM-DD
   * @returns {Promise<object>}
   */
  getTableUtilization: async ({ startDate, endDate } = {}) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get('/dashboard/tables', { params }).catch((error) => {
      const message = error.response?.data?.message ?? 'Unable to fetch table utilization dashboard data.';
      throw new Error(typeof message === 'string' ? message : 'Unable to fetch table utilization dashboard data.', { cause: error });
    });

    return unwrapData(response);
  },

  /**
   * Fetch VIP room analytics
   */
  getVipRoomAnalytics: async () => {
    const response = await api.get('/dashboard/vip-rooms').catch((error) => {
      const message = error.response?.data?.message ?? 'Unable to fetch VIP room analytics.';
      throw new Error(typeof message === 'string' ? message : 'Unable to fetch VIP room analytics.', { cause: error });
    });

    return unwrapData(response);
  },

  /**
   * Fetch kitchen performance analytics
   */
  getKitchenPerformance: async () => {
    const response = await api.get('/dashboard/kitchen').catch((error) => {
      const message = error.response?.data?.message ?? 'Unable to fetch kitchen analytics.';
      throw new Error(typeof message === 'string' ? message : 'Unable to fetch kitchen analytics.', { cause: error });
    });

    return unwrapData(response);
  },
};
