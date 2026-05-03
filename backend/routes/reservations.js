const express = require('express');
const {
  getReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  rejectReservation,
  confirmReservation,
  sendReceipt
} = require('../controllers/reservations');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getReservations)
  .post(protect, createReservation);

router.put('/:id/confirm', protect, authorize('admin', 'payment_manager'), confirmReservation);
router.put('/:id/reject', protect, authorize('admin', 'payment_manager'), rejectReservation);
router.post('/:id/send-receipt', protect, authorize('admin', 'payment_manager'), sendReceipt);

router
  .route('/:id')
  .put(protect, updateReservation)
  .delete(protect, deleteReservation);

router.put('/:id/cancel', protect, deleteReservation);

module.exports = router;
