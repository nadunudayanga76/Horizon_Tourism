const Driver = require('../models/Driver');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Public
exports.getDrivers = async (req, res, next) => {
  try {
    const drivers = await Driver.find();
    res.status(200).json({ success: true, count: drivers.length, data: drivers });
  } catch (err) {
    next(err);
  }
};

// @desc    Add driver
// @route   POST /api/drivers
// @access  Private/Admin/Manager
exports.addDriver = async (req, res, next) => {
  try {
    if (req.file) {
      req.body.image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    const driver = await Driver.create(req.body);
    res.status(201).json({ success: true, data: driver });
  } catch (err) {
    next(err);
  }
};

// @desc    Update driver
// @route   PUT /api/drivers/:id
// @access  Private/Admin/Manager
exports.updateDriver = async (req, res, next) => {
  try {
    if (req.file) {
      req.body.image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json({ success: true, data: driver });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete driver
// @route   DELETE /api/drivers/:id
// @access  Private/Admin/Manager
exports.deleteDriver = async (req, res, next) => {
  try {
    await Driver.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
