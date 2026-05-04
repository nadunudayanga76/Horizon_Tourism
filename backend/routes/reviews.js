const express = require('express');
const { getResidenceReviews, addReview, getAllReviews, getGuideReviews, deleteReview } = require('../controllers/reviews');

const router = express.Router();

router.route('/')
  .get(getAllReviews)
  .post(addReview);

router.route('/:id')
  .delete(deleteReview);

router.route('/residence/:residenceId')
  .get(getResidenceReviews);

router.route('/guide/:guideId')
  .get(getGuideReviews);

module.exports = router;
