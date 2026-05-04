const Feedback = require('../models/Feedback');
const Residence = require('../models/Residence');
const TourGuide = require('../models/TourGuide');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get reviews for a residence
// @route   GET /api/reviews/residence/:residenceId
exports.getResidenceReviews = async (req, res, next) => {
  try {
    const reviews = await Feedback.find({ residenceId: req.params.residenceId }).sort('-createdAt');
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (err) { next(err); }
};

// @desc    Get reviews for a guide
// @route   GET /api/reviews/guide/:guideId
exports.getGuideReviews = async (req, res, next) => {
  try {
    const reviews = await Feedback.find({ guideId: req.params.guideId }).sort('-createdAt');
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (err) { next(err); }
};

// @desc    Get all reviews (for admin/manager)
// @route   GET /api/reviews
exports.getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Feedback.find({ 
      $or: [
        { residenceId: { $exists: true } },
        { guideId: { $exists: true } }
      ]
    })
    .populate('residenceId', 'name')
    .populate('guideId', 'name')
    .sort('-createdAt');
    
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (err) { next(err); }
};

// @desc    Add a review (for residence or guide)
// @route   POST /api/reviews
exports.addReview = async (req, res, next) => {
  try {
    const { residenceId, guideId, rating, comment, userName, userId } = req.body;
    
    // Validation: must have either residenceId or guideId
    if (!residenceId && !guideId) {
      return next(new ErrorResponse('Please provide a residence or guide ID', 400));
    }

    const feedbackData = {
      userId: userId || req.body.userId,
      userName: userName || 'Anonymous User',
      rating: Number(rating) || 5,
      comment: comment || 'No comment provided'
    };

    if (residenceId) feedbackData.residenceId = residenceId;
    if (guideId) feedbackData.guideId = guideId;

    const feedback = await Feedback.create(feedbackData);

    res.status(201).json({ success: true, data: feedback });
  } catch (err) { next(err); }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Feedback.findById(req.params.id);

    if (!review) {
      return next(new ErrorResponse(`Review not found with id of ${req.params.id}`, 404));
    }

    await review.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) { next(err); }
};
