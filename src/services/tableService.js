import api from "../api/axios.js";


export const tableApi = {
    getAll: async () => {
        let currentPage = 0;
        const pageSize = 20;
        let allTables = [];
        let hasNextPage = true;

        while (hasNextPage) {
            const payload = await api.get('/tables', {
                params: { page: currentPage, size: pageSize },
            });

            const pageData = payload?.data;

            if (!pageData || typeof pageData !== 'object') {
                throw new Error('Invalid table pagination data received from server.');
            }
            if (!Array.isArray(pageData.result)) {
                throw new Error('Table list data is not an array.');
            }
            if (!pageData.meta || typeof pageData.meta !== 'object') {
                throw new Error('Missing pagination metadata (meta) from server.');
            }
            if (typeof pageData.meta.hasNext !== 'boolean') {
                throw new Error('Invalid hasNext property in pagination metadata.');
            }

            allTables = allTables.concat(pageData.result);
            hasNextPage = pageData.meta.hasNext;
            currentPage++;
        }

        return allTables;
    },
};