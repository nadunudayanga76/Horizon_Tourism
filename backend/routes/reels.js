const express = require('express');
const {
  getReels,
  createReel,
  deleteReel,
  updateReel
} = require('../controllers/reels');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const videoUpload = require('../middleware/videoUpload');

router
  .route('/')
  .get(getReels)
  .post(protect, authorize('admin', 'feedback_manager'), videoUpload.single('video'), createReel);

router
  .route('/:id')
  .put(protect, authorize('admin', 'feedback_manager'), updateReel)
  .delete(protect, authorize('admin', 'feedback_manager'), deleteReel);

module.exports = router;
