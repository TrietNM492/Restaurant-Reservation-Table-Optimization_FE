import api from '../api/axios.js';
import { unwrapData } from '../utils/unwrapData.js';

export const predictionService = {
  getWaitingTime: async (reservationId) => {
    try {
      const response = await api.post('/predictions/waiting-time', { reservationId });
      return unwrapData(response);
    } catch (error) {
      console.error('Failed to calculate waiting time prediction:', error);
      throw error;
    }
  },
};

export const predictWaitingTime = predictionService.getWaitingTime;
export default predictionService;
