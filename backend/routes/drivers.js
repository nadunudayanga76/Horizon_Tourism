const express = require('express');
const {
  getDrivers,
  addDriver,
  updateDriver,
  deleteDriver
} = require('../controllers/drivers');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router
  .route('/')
  .get(getDrivers)
  .post(protect, authorize('admin', 'transport_manager'), upload.single('image'), addDriver);

router
  .route('/:id')
  .put(protect, authorize('admin', 'transport_manager'), upload.single('image'), updateDriver)
  .delete(protect, authorize('admin', 'transport_manager'), deleteDriver);

module.exports = router;
