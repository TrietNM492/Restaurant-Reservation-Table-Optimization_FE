import api from "../api/axios.js";

const ADMIN_BASE = "/admin/tables";
const PUBLIC_BASE = "/tables";

export const TABLE_STATUSES = [
    "AVAILABLE",
    "RESERVED",
    "IN_USE",
    "CLEANING",
    "LOCKED",
];

export const adminTableApi = {
    /**
     * Fetch paginated list of tables with search and filters (Admin)
     * @param {object} params - { page, size, q, areaId, statusCode }
     */
    getList: async (params = {}) => {
        const { page = 0, size = 10, q = "", areaId = "", statusCode = "" } = params;
        const query = { page, size };
        if (q && q.trim()) query.q = q.trim();
        if (areaId) query.areaId = areaId;
        if (statusCode) query.statusCode = statusCode;
        return api.get(ADMIN_BASE, { params: query });
    },

    /** Check if table number exists */
    checkTableNumberExists: async (tableNumber, excludeId = null) => {
        if (!tableNumber) return false;
        try {
            const res = await api.get(ADMIN_BASE, {
                params: { q: String(tableNumber).trim(), page: 0, size: 20 },
            });
            const payload = res?.data ?? res;
            const items = payload?.result ?? payload?.content ?? (Array.isArray(payload) ? payload : []);
            const num = Number(tableNumber);
            return items.some((t) => Number(t.tableNumber) === num && (!excludeId || t.id !== excludeId));
        } catch {
            return false;
        }
    },

    /** Fetch single table by ID */
    getById: async (id) => api.get(`${ADMIN_BASE}/${id}`),

    /**
     * Create table
     * @param {{ tableNumber: number, capacity: number, areaId: number, statusCode?: string, description?: string }} payload
     */
    create: async (payload) => api.post(ADMIN_BASE, payload),

    /**
     * Update table
     * @param {number} id
     * @param {{ tableNumber: number, capacity: number, areaId: number, statusCode?: string, description?: string }} payload
     */
    update: async (id, payload) => api.put(`${ADMIN_BASE}/${id}`, { ...payload, id }),

    /**
     * Change table status
     * @param {number} id
     * @param {string} statusCode
     */
    changeStatus: async (id, statusCode) =>
        api.patch(`${ADMIN_BASE}/status`, { id, statusCode }),

    /**
     * Toggle table lock
     * @param {number} id
     */
    toggleLock: async (id) => api.patch(`${ADMIN_BASE}/${id}/toggle-lock`),

    /** Delete table */
    remove: async (id) => api.delete(`${ADMIN_BASE}/${id}`),
};

/**
 * Module: Table Status Tracking [2]
 * Endpoints for monitoring table status, floor plan, summary stats and quick status updates
 */
export const tableTrackingApi = {
    /**
     * Fetch paginated table status tracking list
     * @param {object} params - { page, size, q, areaId, statusCode }
     */
    getTables: async (params = {}) => {
        const { page = 0, size = 10, q = "", areaId = "", statusCode = "" } = params;
        const query = { page, size };
        if (q && q.trim()) query.q = q.trim();
        if (areaId) query.areaId = areaId;
        if (statusCode) query.statusCode = statusCode;
        return api.get(PUBLIC_BASE, { params: query });
    },

    /**
     * Fetch real-time summary statistics for table statuses
     * Returns: { totalTables, availableTables, reservedTables, inUseTables, cleaningTables, lockedTables, statusCounts, areaSummaries }
     */
    getSummary: async () => api.get(`${PUBLIC_BASE}/summary`),

    /**
     * Fetch interactive floor plan grouped by area
     * Returns: AreaFloorPlanResponse[] ({ areaId, areaCode, areaName, areaDescription, tables: TableResponse[] })
     */
    getFloorPlan: async () => api.get(`${PUBLIC_BASE}/floor-plan`),

    /**
     * Fetch tables by specific area
     * @param {number} areaId
     */
    getByArea: async (areaId) => api.get(`${PUBLIC_BASE}/area/${areaId}`),

    /**
     * Fetch table detail by ID
     * @param {number} id
     */
    getById: async (id) => api.get(`${PUBLIC_BASE}/${id}`),

    /**
     * Update table status (via Table Status Tracking [2])
     * @param {number} id
     * @param {string} statusCode - AVAILABLE | RESERVED | IN_USE | CLEANING | LOCKED
     */
    changeStatus: async (id, statusCode) =>
        api.patch(`${PUBLIC_BASE}/${id}/status`, { id, statusCode }),
};

export const tableApi = {
    getAll: async () => {
        let currentPage = 0;
        const pageSize = 20;
        let allTables = [];
        let hasNextPage = true;

        while (hasNextPage) {
            const payload = await api.get("/tables", {
                params: { page: currentPage, size: pageSize },
            });

            const pageData = payload?.data;

            if (!pageData || typeof pageData !== "object") {
                throw new Error("Invalid table pagination data received from server.");
            }
            if (!Array.isArray(pageData.result)) {
                throw new Error("Table list data is not an array.");
            }
            if (!pageData.meta || typeof pageData.meta !== "object") {
                throw new Error("Missing pagination metadata (meta) from server.");
            }
            if (typeof pageData.meta.hasNext !== "boolean") {
                throw new Error("Invalid hasNext property in pagination metadata.");
            }

            allTables = allTables.concat(pageData.result);
            hasNextPage = pageData.meta.hasNext;
            currentPage++;
        }

        return allTables;
    },
};
