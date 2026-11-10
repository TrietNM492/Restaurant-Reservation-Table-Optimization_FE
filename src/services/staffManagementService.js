import api from '../api/axios.js';

const data = (response) => response?.data ?? response;
const STAFF = '/admin/staffs';

export const staffManagementApi = {
  list: async (params = {}) => data(await api.get(STAFF, { params })),
  getById: async (id) => data(await api.get(`${STAFF}/${id}`)),
  create: async (payload) => data(await api.post(STAFF, payload)),
  update: async (payload) => data(await api.put(STAFF, payload)),
  changeStatus: async (payload) =>
    data(await api.patch(`${STAFF}/status`, payload)),
};
