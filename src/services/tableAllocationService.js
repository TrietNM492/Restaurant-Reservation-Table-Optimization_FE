import api from '../api/axios';
import { unwrapData } from '../utils/unwrapData';

const BASE = '/tables';
const config = (signal) => ({ signal, timeout: 30000 });

// All allocation/scoring logic belongs to the backend. Preserve its ranks and scores.
export const tableAllocationApi = {
  areas: async (signal) => unwrapData(await api.get(`${BASE}/floor-plan`, config(signal))),
  recommend: async (request, signal) => unwrapData(await api.post(`${BASE}/recommendations`, request, config(signal))),
  alternatives: async (request, signal) => unwrapData(await api.post(`${BASE}/recommendations/alternatives`, request, config(signal))),
  preview: async (request) => unwrapData(await api.post(`${BASE}/allocation-optimization/preview`, request, config())),
  apply: async (request) => unwrapData(await api.post(`${BASE}/allocation-optimization/apply`, request, config())),
};
