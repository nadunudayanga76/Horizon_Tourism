const Residence = require('../models/Residence');
const Reservation = require('../models/Reservation');
const ErrorResponse = require('../utils/ErrorResponse');
const path = require('path');

// @desc    Get all residences
// @route   GET /api/residences
// @access  Public
exports.getResidences = async (req, res, next) => {
  try {
    const residences = await Residence.find();
    res.status(200).json({ success: true, count: residences.length, data: residences });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single residence
// @route   GET /api/residences/:id
// @access  Public
exports.getResidence = async (req, res, next) => {
  try {
    const residence = await Residence.findById(req.params.id);

    if (!residence) {
      return next(new ErrorResponse(`Residence not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: residence });
  } catch (err) {
    next(err);
  }
};

// @desc    Create residence
// @route   POST /api/residences
// @access  Private/Admin
exports.createResidence = async (req, res, next) => {
  try {
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map(f => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`);
      req.body.images = newImages;
      req.body.image = newImages[0]; // fallback for backward compatibility
    }

    const residence = await Residence.create(req.body);
    res.status(201).json({ success: true, data: residence });
  } catch (err) {
    next(err);
  }
};

// @desc    Update residence
// @route   PUT /api/residences/:id
// @access  Private/Admin
exports.updateResidence = async (req, res, next) => {
  try {
    let residence = await Residence.findById(req.params.id);

    if (!residence) {
      return next(new ErrorResponse(`Residence not found with id of ${req.params.id}`, 404));
    }

    let finalImages = [];
    
    // Check if we have existing images passed from frontend (could be string or array of strings)
    if (req.body.existingImages) {
      if (Array.isArray(req.body.existingImages)) {
        finalImages = req.body.existingImages;
      } else {
        finalImages = [req.body.existingImages];
      }
    }

    // Add newly uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => `${req.protocol}://${req.get('host')}/uploads/${f.filename}`);
      finalImages = [...finalImages, ...newImages];
    }

    if (finalImages.length > 0) {
      req.body.images = finalImages;
      req.body.image = finalImages[0];
    }

    residence = await Residence.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: residence });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete residence
// @route   DELETE /api/residences/:id
// @access  Private/Admin
exports.deleteResidence = async (req, res, next) => {
  try {
    const residence = await Residence.findById(req.params.id);

    if (!residence) {
      return next(new ErrorResponse(`Residence not found with id of ${req.params.id}`, 404));
    }

    await residence.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload photo for residence
// @route   PUT /api/residences/:id/photo
// @access  Private/Admin
exports.residencePhotoUpload = async (req, res, next) => {
  try {
    const residence = await Residence.findById(req.params.id);

    if (!residence) {
      return next(new ErrorResponse(`Residence not found with id of ${req.params.id}`, 404));
    }

    if (!req.file) {
      return next(new ErrorResponse(`Please upload a file`, 400));
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    await Residence.findByIdAndUpdate(req.params.id, { image: imageUrl });

    res.status(200).json({
      success: true,
      data: imageUrl
    });
  } catch (err) {
    next(err);
  }
};
