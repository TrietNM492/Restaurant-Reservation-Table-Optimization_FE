import api from '../api/axios.js';

const BASE = '/admin/table-areas';

// AreaName enum values from the backend
export const AREA_NAMES = ['INDOOR', 'OUTDOOR', 'GARDEN', 'WINDOW'];

export const tableAreaApi = {
  /**
   * Fetch paginated table areas.
   * @param {object} params - { page, size, q, name }
   *   q    – free-text search (code / name)
   *   name – AreaName enum filter (INDOOR | OUTDOOR | GARDEN | WINDOW)
   */
  getList: async (params = {}) => {
    const { page = 0, size = 10, q = '', name = '' } = params;
    const query = { page, size };
    if (q.trim()) query.q = q.trim();
    if (name) query.name = name;
    return api.get(BASE, { params: query });
  },

  /** Fetch single table area by id. */
  getById: async (id) => api.get(`${BASE}/${id}`),

  /**
   * Create a new table area.
   * @param {{ code: string, name: string, description: string }} payload
   */
  create: async (payload) => api.post(BASE, payload),

  /**
   * Update an existing table area.
   * @param {number} id
   * @param {{ code: string, name: string, description: string }} payload
   */
  update: async (id, payload) => api.put(`${BASE}/${id}`, { ...payload, id }),

  /** Delete a table area by id. */
  remove: async (id) => api.delete(`${BASE}/${id}`),
};
