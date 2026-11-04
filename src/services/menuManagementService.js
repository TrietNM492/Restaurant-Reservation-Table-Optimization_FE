import api from '../api/axios';

// Axios already unwraps the HTTP response. Keep pagination inside the API envelope.
const data = (response) => response?.data ?? response;
const categoryPath = '/admin/menu-category';
const itemPath = '/admin/menu-item';

export const categoryApi = {
  list: async (params, signal) => data(await api.get(categoryPath, { params, signal })),
  detail: async (id, signal) => data(await api.get(`${categoryPath}/${id}`, { signal })),
  create: async (body) => data(await api.post(categoryPath, body)),
  update: async (id, body) => data(await api.put(`${categoryPath}/${id}`, body)),
  remove: (id) => api.delete(`${categoryPath}/${id}`),
  // Admin selectors must include empty categories and all pages.
  options: async (signal) => {
    const categories = [];
    let page = 0;
    let hasNext;
    do {
      const result = await categoryApi.list({ page, size: 100, sort: 'name,asc' }, signal);
      categories.push(...result.result);
      hasNext = result.meta.hasNext;
      page += 1;
    } while (hasNext);
    return categories;
  },
};

export const itemApi = {
  list: async (params, signal) => data(await api.get(itemPath, { params, signal })),
  detail: async (id, signal) => data(await api.get(`${itemPath}/${id}`, { signal })),
  create: async (body) => data(await api.post(itemPath, body)),
  update: async (id, body) => data(await api.put(`${itemPath}/${id}`, body)),
  status: async (id, status) => data(await api.patch(`${itemPath}/${id}/status`, { status })),
  archive: (id) => api.delete(`${itemPath}/${id}`),
};

export const publicMenuApi = {
  categories: async (signal) => data(await api.get('/menus/categories', { signal, skipAuth: true })),
  browse: async (params, signal) => data(await api.get('/menus', { params, signal, skipAuth: true })),
  detail: async (id, signal) => data(await api.get(`/menus/${id}`, { signal, skipAuth: true })),
};
