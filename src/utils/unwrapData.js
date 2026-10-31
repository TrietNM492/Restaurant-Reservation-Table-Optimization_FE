export const unwrapData = (response) => {
  // Axios interceptor already returns response.data, but some calls may still return the full response object.
  // This helper safely extracts the payload while guarding against undefined/null.
  if (response && typeof response === 'object') {
    if ('data' in response) {
      return response.data;
    }
    return response;
  }
  return response;
};
