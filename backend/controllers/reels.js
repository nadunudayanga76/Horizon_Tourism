const Reel = require('../models/Reel');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get all reels
// @route   GET /api/reels
// @access  Public
exports.getReels = async (req, res, next) => {
  try {
    const reels = await Reel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reels.length, data: reels });
  } catch (err) {
    next(err);
  }
};

// @desc    Create reel
// @route   POST /api/reels
// @access  Private
exports.createReel = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ErrorResponse('Please upload a video file', 400));
    }

    const videoUrl = req.file.filename;
    
    const reelData = {
      title: req.body.title || 'Horizon Travel Reel',
      description: req.body.description || '',
      videoUrl: videoUrl,
      userName: req.user.name,
      userAvatar: req.user.avatar || '',
      likes: 0
    };

    const reel = await Reel.create(reelData);
    res.status(201).json({ success: true, data: reel });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete reel
// @route   DELETE /api/reels/:id
// @access  Private
exports.deleteReel = async (req, res, next) => {
  try {
    const reel = await Reel.findById(req.params.id);

    if (!reel) {
      return next(new ErrorResponse(`Reel not found with id of ${req.params.id}`, 404));
    }

    await reel.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
// @desc    Update reel
// @route   PUT /api/reels/:id
// @access  Private
exports.updateReel = async (req, res, next) => {
  try {
    let reel = await Reel.findById(req.params.id);

    if (!reel) {
      return next(new ErrorResponse(`Reel not found with id of ${req.params.id}`, 404));
    }

    // Only update title and description for now
    const fieldsToUpdate = {};
    if (req.body.title) fieldsToUpdate.title = req.body.title;
    if (req.body.description) fieldsToUpdate.description = req.body.description;

    reel = await Reel.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: reel });
  } catch (err) {
    next(err);
  }
};
