

export const unwrapData = (payload) => {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        const { data } = payload;
        if (data && typeof data === 'object' && 'result' in data && 'meta' in data) {
            return data.result;
        }

        return data;
    }

    return payload;
};