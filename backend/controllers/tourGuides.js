const TourGuide = require('../models/TourGuide');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get all guides
// @route   GET /api/guides
// @access  Public
exports.getGuides = async (req, res, next) => {
  try {
    const guides = await TourGuide.find();
    res.status(200).json({ success: true, count: guides.length, data: guides });
  } catch (err) {
    next(err);
  }
};

// @desc    Add guide
// @route   POST /api/guides
// @access  Private/Admin
exports.addGuide = async (req, res, next) => {
  try {
    if (req.file) {
      req.body.image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    if (req.body.language && typeof req.body.language === 'string') {
      req.body.language = req.body.language.split(',').map(l => l.trim());
    }
    const guide = await TourGuide.create(req.body);
    res.status(201).json({ success: true, data: guide });
  } catch (err) {
    next(err);
  }
};

// @desc    Update guide
// @route   PUT /api/guides/:id
// @access  Private/Admin
exports.updateGuide = async (req, res, next) => {
  try {
    if (req.file) {
      req.body.image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    if (req.body.language && typeof req.body.language === 'string') {
      req.body.language = req.body.language.split(',').map(l => l.trim());
    }
    const guide = await TourGuide.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json({ success: true, data: guide });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete guide
// @route   DELETE /api/guides/:id
// @access  Private/Admin
exports.deleteGuide = async (req, res, next) => {
  try {
    await TourGuide.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Filter guides
// @route   GET /api/guides/filter
// @access  Public
exports.filterGuides = async (req, res, next) => {
  try {
    const { language, availability } = req.query;
    let filter = {};
    if (language) filter.language = language;
    if (availability) filter.availability = availability === 'true';

    const guides = await TourGuide.find(filter);
    res.status(200).json({ success: true, count: guides.length, data: guides });
  } catch (err) {
    next(err);
  }
};
// @desc    Book guide
// @route   POST /api/guides/:id/book
// @access  Private
exports.bookGuide = async (req, res, next) => {
  try {
    const guide = await TourGuide.findById(req.params.id);

    if (!guide) {
      return next(new ErrorResponse(`Guide not found with id of ${req.params.id}`, 404));
    }

    if (!guide.availability) {
      return next(new ErrorResponse('Guide is already booked and unavailable', 400));
    }

    guide.availability = false;
    await guide.save();

    res.status(200).json({ success: true, data: guide });
  } catch (err) {
    next(err);
  }
};
