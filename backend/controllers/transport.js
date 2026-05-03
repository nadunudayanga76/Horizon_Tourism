const Transport = require('../models/Transport');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get all vehicles
// @route   GET /api/transport
// @access  Public
exports.getVehicles = async (req, res, next) => {
  try {
    const vehicles = await Transport.find();
    res.status(200).json({ success: true, count: vehicles.length, data: vehicles });
  } catch (err) {
    next(err);
  }
};

// @desc    Add vehicle
// @route   POST /api/transport
// @access  Private/Admin
exports.addVehicle = async (req, res, next) => {
  try {
    if (req.file) {
      req.body.image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    const vehicle = await Transport.create(req.body);
    res.status(201).json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

// @desc    Update vehicle
// @route   PUT /api/transport/:id
// @access  Private/Admin
exports.updateVehicle = async (req, res, next) => {
  try {
    if (req.file) {
      req.body.image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    const vehicle = await Transport.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/transport/:id
// @access  Private/Admin
exports.deleteVehicle = async (req, res, next) => {
  try {
    await Transport.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// @desc    Book transport
// @route   POST /api/transport/:id/book
// @access  Private
exports.bookTransport = async (req, res, next) => {
  try {
    const vehicle = await Transport.findById(req.params.id);
    if (!vehicle) {
      return next(new ErrorResponse('Vehicle not found', 404));
    }
    if (!vehicle.availability) {
      return next(new ErrorResponse('Vehicle is not available', 400));
    }
    
    // In a real app, you'd create a BookingTransport model. 
    // Here we just mark as unavailable for simplicity or return success.
    vehicle.availability = false;
    await vehicle.save();

    res.status(200).json({ success: true, message: 'Transport booked successfully' });
  } catch (err) {
    next(err);
  }
};
