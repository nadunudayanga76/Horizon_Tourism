import axios from 'axios';
import { API_URL } from '../utils/config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 120 second timeout for large video uploads
});

export const residenceService = {
  getResidences: () => api.get('/residences'),
  getResidence: (id) => api.get(`/residences/${id}`),
  createResidence: (data, config) => api.post('/residences', data, config),
  updateResidence: (id, data, config) => api.put(`/residences/${id}`, data, config),
  deleteResidence: (id) => api.delete(`/residences/${id}`),
};

export const reservationService = {
  getReservations: () => api.get('/reservations'),
  createReservation: (data) => api.post('/reservations', data),
  updateReservation: (id, data) => api.put(`/reservations/${id}`, data),
  cancelReservation: (id) => api.put(`/reservations/${id}/cancel`),
  deleteReservation: (id) => api.delete(`/reservations/${id}`),
  rejectReservation: (id) => api.put(`/reservations/${id}/reject`),
  confirmReservation: (id) => api.put(`/reservations/${id}/confirm`),
  sendReceipt: (id) => api.post(`/reservations/${id}/send-receipt`),
};

export const transportService = {
  getVehicles: () => api.get('/transport'),
  addVehicle: (data, config) => api.post('/transport', data, config),
  updateVehicle: (id, data, config) => api.put(`/transport/${id}`, data, config),
  deleteVehicle: (id) => api.delete(`/transport/${id}`),
  bookTransport: (id) => api.post(`/transport/${id}/book`),
};

export const driverService = {
  getDrivers: () => api.get('/drivers'),
  addDriver: (data, config) => api.post('/drivers', data, config),
  updateDriver: (id, data, config) => api.put(`/drivers/${id}`, data, config),
  deleteDriver: (id) => api.delete(`/drivers/${id}`),
};

export const transportBookingService = {
  getBookings: () => api.get('/transport-bookings'),
  createBooking: (data) => api.post('/transport-bookings', data),
  updateStatus: (id, status) => api.put(`/transport-bookings/${id}/status`, { status }),
  deleteBooking: (id) => api.delete(`/transport-bookings/${id}`),
};

export const guideService = {
  getGuides: () => api.get('/guides'),
  addGuide: (data, config) => api.post('/guides', data, config),
  updateGuide: (id, data, config) => api.put(`/guides/${id}`, data, config),
  deleteGuide: (id) => api.delete(`/guides/${id}`),
  filterGuides: (params) => api.get('/guides/filter', { params }),
  bookGuide: (id) => api.post(`/guides/${id}/book`),
};

export const paymentService = {
  getPayments: () => api.get('/payments'),
  addPayment: (data) => api.post('/payments', data),
  getSummary: () => api.get('/payments/summary'),
  deletePayment: (id) => api.delete(`/payments/${id}`),
};

export const reviewService = {
  getAllReviews: () => api.get('/reviews'),
  getResidenceReviews: (residenceId) => api.get(`/reviews/residence/${residenceId}`),
  getGuideReviews: (guideId) => api.get(`/reviews/guide/${guideId}`),
  addReview: (data) => api.post('/reviews', data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
};

export const reelService = {
  getReels: () => api.get('/reels'),
  createReel: (data, config) => api.post('/reels', data, config),
  updateReel: (id, data) => api.put(`/reels/${id}`, data),
  deleteReel: (id) => api.delete(`/reels/${id}`),
};

export default api;
