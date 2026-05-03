const express = require('express');
const {
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  bookTransport
} = require('../controllers/transport');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router
  .route('/')
  .get(getVehicles)
  .post(protect, authorize('admin', 'transport_manager'), upload.single('image'), addVehicle);

router
  .route('/:id')
  .put(protect, authorize('admin', 'transport_manager'), upload.single('image'), updateVehicle)
  .delete(protect, authorize('admin', 'transport_manager'), deleteVehicle);

router.post('/:id/book', bookTransport);

module.exports = router;
