const TransportBooking = require('../models/TransportBooking');
const Transport = require('../models/Transport');
const Driver = require('../models/Driver');
const Payment = require('../models/Payment');
const ErrorResponse = require('../utils/ErrorResponse');

// @desc    Get all transport bookings
// @route   GET /api/transport-bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
  try {
    console.log('Fetching transport bookings, user role:', req.user?.role);
    const bookings = await TransportBooking.find()
      .populate('vehicle')
      .populate('driver')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    console.log('Found bookings:', bookings.length);
    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    next(err);
  }
};

// @desc    Create transport booking
// @route   POST /api/transport-bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
  try {
    console.log('Creating transport booking, body:', JSON.stringify(req.body));
    console.log('User ID:', req.user?.id);
    req.body.user = req.user.id;
    const booking = await TransportBooking.create(req.body);
    console.log('Booking created with ID:', booking._id);
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    console.error('Error creating booking:', err.message);
    next(err);
  }
};

// @desc    Update booking status (Approve/Reject)
// @route   PUT /api/transport-bookings/:id/status
// @access  Private/FinanceManager
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    let booking = await TransportBooking.findById(req.params.id);

    if (!booking) {
      return next(new ErrorResponse('Booking not found', 404));
    }

    // Keep track of old status to avoid duplicate payments
    const previouslyApproved = booking.status === 'Approved';

    booking.status = status;
    
    // If approved, mark payment as paid and update vehicle availability
    if (status === 'Approved') {
      booking.paymentStatus = 'Paid'; 
      
      // Update vehicle availability to false
      if (booking.vehicle) {
        await Transport.findByIdAndUpdate(booking.vehicle, { availability: false });
      }

      // Create a corresponding payment record if not previously approved
      // This allows the Finance Manager to see it in the payments collection
      if (!previouslyApproved) {
        await Payment.create({
          userId: booking.user,
          amount: booking.totalPrice,
          status: 'Completed', // 'Completed' indicates the payment is confirmed
          transportBookingId: booking._id
        });
      }
    } else if (status === 'Rejected' || status === 'Successful') {
      // If rejected or marking as successful (finished), set availability back to true
      if (booking.vehicle) {
        await Transport.findByIdAndUpdate(booking.vehicle, { availability: true });
      }
    }

    await booking.save();
    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete booking
// @route   DELETE /api/transport-bookings/:id
// @access  Private/Admin
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await TransportBooking.findByIdAndDelete(req.params.id);
    if (!booking) return next(new ErrorResponse('Booking not found', 404));
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};
