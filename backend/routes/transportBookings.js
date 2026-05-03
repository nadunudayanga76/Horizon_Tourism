const express = require('express');
const {
  getBookings,
  createBooking,
  updateStatus,
  deleteBooking
} = require('../controllers/transportBookings');

const router = express.Router();
const { protect } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getBookings)
  .post(protect, createBooking);

router
  .route('/:id')
  .delete(protect, deleteBooking);

router.put('/:id/status', protect, updateStatus);

module.exports = router;
