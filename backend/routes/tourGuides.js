const express = require('express');
const {
  getGuides,
  addGuide,
  updateGuide,
  deleteGuide,
  filterGuides,
  bookGuide
} = require('../controllers/tourGuides');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/filter', filterGuides);

router
  .route('/')
  .get(getGuides)
  .post(protect, authorize('admin', 'guide_manager', 'tour_manager'), upload.single('image'), addGuide);

router
  .route('/:id')
  .put(protect, authorize('admin', 'guide_manager', 'tour_manager'), upload.single('image'), updateGuide)
  .delete(protect, authorize('admin', 'guide_manager', 'tour_manager'), deleteGuide);

router.post('/:id/book', protect, bookGuide);

module.exports = router;
