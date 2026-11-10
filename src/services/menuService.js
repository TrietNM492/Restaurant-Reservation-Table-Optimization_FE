import api from "../api/axios.js";
import {restaurants} from "../data/restaurants.js";
import {unwrapData} from "../utils/unwrapData.js";


const isApiAvailable = async () => {
    try {
        await api.get('/menus/categories', { timeout: 2500 });
        return true;
    } catch {
        return false;
    }
};

export const menuApi = {
    getCategories: async () => {
        const available = await isApiAvailable();
        if (!available) {
            return [
                { id: 1, name: 'Fine Dining' },
                { id: 2, name: 'Asian Fusion' },
                { id: 3, name: 'Seafood' },
                { id: 4, name: 'Family Dining' },
            ];
        }

        const response = await api.get('/menus/categories');
        return unwrapData(response);
    },

    search: async (params = {}) => {
        const available = await isApiAvailable();
        if (!available) {
            return {
                meta: { page: 1, pageSize: 10, pages: 1, total: restaurants.length, hasNext: false, hasPrevious: false },
                result: restaurants.map((restaurant, index) => ({
                    id: index + 1,
                    itemName: restaurant.name,
                    description: restaurant.description,
                    price: 89 + index * 17,
                    itemPicture: restaurant.image,
                    categoryId: 1,
                    categoryName: restaurant.cuisine,
                })),
            };
        }

        const response = await api.get('/menus', { params: { page: 1, size: 10, ...params } });
        return unwrapData(response);
    },
};