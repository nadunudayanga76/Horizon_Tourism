const express = require('express');
const {
  getResidences,
  getResidence,
  createResidence,
  updateResidence,
  deleteResidence,
  residencePhotoUpload
} = require('../controllers/residences');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router
  .route('/')
  .get(getResidences)
  .post(protect, authorize('admin', 'reservation_manager'), upload.array('images', 5), createResidence);

router
  .route('/:id')
  .get(getResidence)
  .put(protect, authorize('admin', 'reservation_manager'), upload.array('images', 5), updateResidence)
  .delete(protect, authorize('admin', 'reservation_manager'), deleteResidence);

router.put('/:id/photo', protect, authorize('admin', 'reservation_manager'), upload.array('images', 5), residencePhotoUpload);

module.exports = router;
