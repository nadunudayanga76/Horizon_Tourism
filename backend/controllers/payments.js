const Payment = require('../models/Payment');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Add payment
// @route   POST /api/payments
// @access  Private
exports.addPayment = async (req, res, next) => {
  try {
    req.body.userId = req.user.id;
    const payment = await Payment.create(req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

// @desc    Get payments
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res, next) => {
  try {
    let query;
    if (req.user.role === 'admin' || req.user.role === 'payment_manager') {
      query = Payment.find().populate('userId', 'name email');
    } else {
      query = Payment.find({ userId: req.user.id });
    }
    const payments = await query;
    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (err) {
    next(err);
  }
};

// @desc    Get payment summary
// @route   GET /api/payments/summary
// @access  Private/Admin
exports.getPaymentSummary = async (req, res, next) => {
  try {
    const summary = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    res.status(200).json({ success: true, data: summary[0] || { totalAmount: 0, count: 0 } });
  } catch (err) {
    next(err);
  }
};
