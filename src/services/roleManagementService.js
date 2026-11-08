import api from '../api/axios.js';

const data = (response) => response?.data ?? response;
const ROLES = '/roles';
const PERMISSIONS = '/permissions/';

export const roleManagementApi = {
  list: async (params = {}) => data(await api.get(ROLES, { params })),
  getById: async (id) => data(await api.get(`${ROLES}/${id}`)),
  create: async (payload) => data(await api.post(ROLES, payload)),
  update: async (id, payload) => data(await api.put(`${ROLES}/${id}`, payload)),
  updatePermissions: async (id, permissionIds) =>
    data(await api.put(`${ROLES}/${id}/permissions`, { permissionIds })),
  remove: (id) => api.delete(`${ROLES}/${id}`),
  listPermissions: async (params = {}) => data(await api.get(PERMISSIONS, { params })),
  listAllPermissions: async () => {
    const permissions = [];
    let page = 0;
    let hasNext;

    do {
      const result = await roleManagementApi.listPermissions({ page, size: 100 });
      if (!Array.isArray(result?.result)) {
        throw new Error('The permissions response is invalid.');
      }
      permissions.push(...result.result);
      hasNext = result.meta?.hasNext;
      page += 1;
    } while (hasNext);

    return permissions;
  },
};
