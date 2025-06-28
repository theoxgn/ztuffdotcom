import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Return Service Functions

/**
 * Check if an order item is eligible for return
 * @param {string} orderId 
 * @param {string} orderItemId 
 * @returns {Promise} API response
 */
export const checkReturnEligibility = async (orderId, orderItemId) => {
  try {
    const response = await api.get(`/returns/eligibility/${orderId}/${orderItemId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Create a return request
 * @param {string} orderId 
 * @param {string} orderItemId 
 * @param {Object} returnData 
 * @returns {Promise} API response
 */
export const createReturnRequest = async (orderId, orderItemId, returnData) => {
  try {
    const response = await api.post(`/returns/request/${orderId}/${orderItemId}`, returnData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get user's return requests
 * @param {Object} params - Query parameters (page, limit, status)
 * @returns {Promise} API response
 */
export const getUserReturns = async (params = {}) => {
  try {
    const response = await api.get('/returns/my-returns', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get return request by ID
 * @param {string} returnId 
 * @returns {Promise} API response
 */
export const getReturnById = async (returnId) => {
  try {
    const response = await api.get(`/returns/${returnId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get return request by ID for admin
 * @param {string} returnId 
 * @returns {Promise} API response
 */
export const getAdminReturnById = async (returnId) => {
  try {
    const response = await api.get(`/admin/returns/${returnId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting admin return by ID:', error);
    throw new Error(error.response?.data?.message || 'Gagal memuat detail pengembalian');
  }
};

/**
 * Cancel a return request
 * @param {string} returnId 
 * @returns {Promise} API response
 */
export const cancelReturnRequest = async (returnId) => {
  try {
    const response = await api.put(`/returns/${returnId}/cancel`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Admin Functions

/**
 * Get all return requests (admin only)
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const getAllReturns = async (params = {}) => {
  try {
    const response = await api.get('/admin/returns', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Process return request (admin only)
 * @param {string} returnId 
 * @param {Object} processData - {action: 'approve'|'reject', admin_notes, approved_amount}
 * @returns {Promise} API response
 */
export const processReturnRequest = async (returnId, processData) => {
  try {
    const response = await api.put(`/admin/returns/${returnId}/process`, processData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Mark return item as received (admin only)
 * @param {string} returnId 
 * @param {Object} receivedData - {admin_notes, received_date, shipping_tracking}
 * @returns {Promise} API response
 */
export const markItemReceived = async (returnId, receivedData) => {
  try {
    const response = await api.put(`/admin/returns/${returnId}/mark-received`, receivedData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Process quality check (admin only)
 * @param {string} returnId 
 * @param {Object} qcData - Quality check data
 * @returns {Promise} API response
 */
export const processQualityCheck = async (returnId, qcData) => {
  try {
    const response = await api.put(`/admin/returns/${returnId}/quality-check`, qcData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Process refund (admin only)
 * @param {string} returnId 
 * @param {Object} refundData - {refund_amount, refund_method, refund_notes}
 * @returns {Promise} API response
 */
export const processRefund = async (returnId, refundData) => {
  try {
    const response = await api.put(`/admin/returns/${returnId}/refund`, refundData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Helper functions for return reasons and status
export const getReturnReasons = () => [
  { value: 'defective', label: 'Produk Rusak/Cacat' },
  { value: 'wrong_item', label: 'Barang Salah' },
  { value: 'not_as_described', label: 'Tidak Sesuai Deskripsi' },
  { value: 'changed_mind', label: 'Berubah Pikiran' },
  { value: 'damaged_shipping', label: 'Rusak Saat Pengiriman' },
  { value: 'missing_parts', label: 'Ada Bagian yang Hilang' },
  { value: 'size_issue', label: 'Masalah Ukuran' },
  { value: 'quality_issue', label: 'Masalah Kualitas' }
];

export const getReturnTypes = () => [
  { value: 'refund', label: 'Pengembalian Uang' },
  { value: 'exchange', label: 'Tukar Barang' },
  { value: 'store_credit', label: 'Kredit Toko' }
];

export const getRefundMethods = () => [
  { value: 'original_payment', label: 'Metode Pembayaran Asli' },
  { value: 'store_credit', label: 'Kredit Toko' },
  { value: 'bank_transfer', label: 'Transfer Bank' }
];

export const getReturnStatusText = (status) => {
  const statusMap = {
    'pending': { text: 'Menunggu Persetujuan', color: 'warning' },
    'approved': { text: 'Disetujui', color: 'info' },
    'rejected': { text: 'Ditolak', color: 'danger' },
    'item_received': { text: 'Barang Diterima', color: 'info' },
    'quality_check': { text: 'Pemeriksaan Kualitas', color: 'warning' },
    'processing': { text: 'Sedang Diproses', color: 'info' },
    'completed': { text: 'Selesai', color: 'success' },
    'cancelled': { text: 'Dibatalkan', color: 'secondary' }
  };
  
  return statusMap[status] || { text: status, color: 'secondary' };
};

export default {
  checkReturnEligibility,
  createReturnRequest,
  getUserReturns,
  getReturnById,
  cancelReturnRequest,
  getAllReturns,
  processReturnRequest,
  markItemReceived,
  processQualityCheck,
  processRefund,
  getReturnReasons,
  getReturnTypes,
  getRefundMethods,
  getReturnStatusText
};