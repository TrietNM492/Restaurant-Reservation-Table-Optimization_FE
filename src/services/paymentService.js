import api from '../api/axios.js';
import { unwrapData } from '../utils/unwrapData.js';

export const paymentApi = {
  /**
   * Create a new payment URL for VNPay (Deposit or Full Payment)
   * @param {Object} payload
   * @param {number} payload.orderId
   * @param {number} payload.amount
   * @param {string} [payload.paymentMethod='VNPAY']
   * @param {string} [payload.paymentType='DEPOSIT'] - 'DEPOSIT' | 'FINAL'
   * @returns {Promise<object>}
   */
  createPayment: async (payload) => {
    const response = await api.post('/payment/create', payload).catch((error) => {
      const message = error.response?.data?.message ?? 'Failed to initialize payment.';
      throw new Error(typeof message === 'string' ? message : 'Failed to initialize payment.', { cause: error });
    });
    return unwrapData(response);
  },

  /**
   * Process VNPay Return callback parameters from URL
   * @param {Object} params - Query parameters from window.location.search
   * @returns {Promise<object>} VnPayReturnResponseDTO
   */
  processVnPayReturn: async (params) => {
    const response = await api.get('/payments/vnpay-return', { params }).catch((error) => {
      const message = error.response?.data?.message ?? 'Failed to verify payment return data.';
      throw new Error(typeof message === 'string' ? message : 'Failed to verify payment return data.', { cause: error });
    });
    return unwrapData(response);
  },

  /**
   * Get invoice details for a payment
   * @param {number} paymentId
   * @returns {Promise<object>} InvoiceResponseDTO
   */
  getInvoice: async (paymentId) => {
    if (!paymentId) throw new Error('Missing payment ID for invoice.');
    const response = await api.get(`/payments/${paymentId}/invoice`).catch((error) => {
      const message = error.response?.data?.message ?? 'Failed to fetch invoice details.';
      throw new Error(typeof message === 'string' ? message : 'Failed to fetch invoice details.', { cause: error });
    });
    return unwrapData(response);
  },

  /**
   * Download official invoice PDF file
   * @param {number} paymentId
   */
  downloadInvoicePdf: async (paymentId) => {
    if (!paymentId) throw new Error('Missing payment ID for invoice download.');

    // Direct download endpoint in backend
    const url = `${api.defaults.baseURL || '/api/v1'}/payments/${paymentId}/invoice/download`;
    
    try {
      // Trigger browser download via blob
      const response = await api.get(`/payments/${paymentId}/invoice/download`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `invoice-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      // Fallback: open direct URL in new tab
      window.open(url, '_blank');
    }
  },

  /**
   * Fetch payment history for authenticated customer
   * @param {Object} options
   * @param {string} [options.status]
   * @param {number} [options.page=1]
   * @param {number} [options.size=10]
   */
  getMyPaymentHistory: async ({ status, page = 1, size = 10 } = {}) => {
    const params = { page, size };
    if (status) params.status = status;

    const response = await api.get('/payments/my-history', { params }).catch((error) => {
      const message = error.response?.data?.message ?? 'Unable to fetch payment history.';
      throw new Error(typeof message === 'string' ? message : 'Unable to fetch payment history.', { cause: error });
    });
    return unwrapData(response);
  },
};

