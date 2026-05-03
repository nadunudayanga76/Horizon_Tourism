const Reservation = require('../models/Reservation');
const Residence = require('../models/Residence');
const Payment = require('../models/Payment');
const TourGuide = require('../models/TourGuide');
const ErrorResponse = require('../utils/ErrorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private
exports.getReservations = asyncHandler(async (req, res, next) => {
  let query;

  // If user is admin or payment_manager, show all reservations
  if (req.user.role === 'admin' || req.user.role === 'payment_manager' || req.user.role === 'reservation_manager') {
    query = Reservation.find();
  } else {
    // Normal users only see their own bookings
    query = Reservation.find({ userId: req.user.id });
  }

  const reservations = await query.populate([
    {
      path: 'residenceId',
      select: 'name location price'
    },
    {
      path: 'guideId',
      select: 'name price'
    },
    {
      path: 'userId',
      select: 'name email'
    }
  ]);

  res.status(200).json({ success: true, count: reservations.length, data: reservations });
});

// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Public
exports.getResidence = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id).populate('residenceId');

  if (!reservation) {
    return next(new ErrorResponse(`Reservation not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({ success: true, data: reservation });
});

// @desc    Create reservation
// @route   POST /api/reservations
// @access  Private
exports.createReservation = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.userId = req.user.id;

  const { residenceId, guideId, checkInDate, checkOutDate, bookingType } = req.body;

  // Check for overlapping confirmed reservations for the specific resource
  const query = {
    status: 'Confirmed',
    $or: [
      {
        checkInDate: { $lt: new Date(checkOutDate) },
        checkOutDate: { $gt: new Date(checkInDate) }
      }
    ]
  };

  if (bookingType === 'hotel') {
    query.residenceId = residenceId;
  } else {
    query.guideId = guideId;
  }

  const existingReservation = await Reservation.findOne(query);

  if (existingReservation) {
    const resourceName = bookingType === 'hotel' ? 'property' : 'tour guide';
    return next(new ErrorResponse(`This ${resourceName} is already booked for the selected dates`, 400));
  }

  const reservation = await Reservation.create(req.body);

  res.status(201).json({
    success: true,
    data: reservation
  });
});

// @desc      Confirm reservation (Finance Manager)
// @route     PUT /api/reservations/:id/confirm
// @access    Private (Admin, payment_manager)
exports.confirmReservation = asyncHandler(async (req, res, next) => {
  let reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    return next(new ErrorResponse(`Reservation not found with id of ${req.params.id}`, 404));
  }

  // Before confirming, check if another booking was confirmed for the same dates
  const overlappingQuery = {
    _id: { $ne: req.params.id },
    status: 'Confirmed',
    $or: [
      {
        checkInDate: { $lt: reservation.checkOutDate },
        checkOutDate: { $gt: reservation.checkInDate }
      }
    ]
  };

  if (reservation.bookingType === 'hotel') {
    overlappingQuery.residenceId = reservation.residenceId;
  } else {
    overlappingQuery.guideId = reservation.guideId;
  }

  const overlapping = await Reservation.findOne(overlappingQuery);

  if (overlapping) {
    return next(new ErrorResponse('Cannot confirm: This property is already booked for these dates by another user', 400));
  }

  reservation = await Reservation.findByIdAndUpdate(
    req.params.id,
    { status: 'Confirmed' },
    { new: true, runValidators: true }
  ).populate('userId residenceId guideId');

  // Create a corresponding payment record to update total revenue
  await Payment.create({
    userId: reservation.userId._id,
    amount: reservation.totalPrice,
    status: 'Completed',
    reservationId: reservation._id
  });

  // Mark resource as unavailable immediately
  if (reservation.bookingType === 'hotel' && reservation.residenceId) {
    await Residence.findByIdAndUpdate(reservation.residenceId._id, { availability: false });
  } else if (reservation.bookingType === 'guide' && reservation.guideId) {
    await TourGuide.findByIdAndUpdate(reservation.guideId._id, { availability: false });
  }

  // Send Confirmation Email Automatically
  try {
    const html = `
      <div style="background-color: #121212; padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff; border-radius: 24px; max-width: 600px; margin: auto;">
        <div style="text-align: center;">
          <h1 style="color: #5c8aff; font-size: 32px; margin-bottom: 8px; font-weight: 800;">Horizon Tourism</h1>
          <p style="color: #888888; font-size: 16px; margin-top: 0;">Booking Confirmation Receipt</p>
        </div>
        
        <div style="background-color: #1e1e1e; padding: 32px; border-radius: 20px; margin-top: 32px; border: 1px solid #333;">
          <h2 style="margin-top: 0; font-size: 22px; color: #ffffff; margin-bottom: 24px; border-bottom: 1px solid #333; padding-bottom: 12px;">Reservation Details</h2>
          
          <div style="margin-bottom: 16px;">
            <span style="color: #888888; font-size: 14px; font-weight: 600;">Customer Name:</span>
            <span style="display: block; font-size: 18px; color: #ffffff; margin-top: 4px;">${reservation.fullName}</span>
          </div>

          <div style="margin-bottom: 16px;">
            <span style="color: #888888; font-size: 14px; font-weight: 600;">${reservation.bookingType === 'hotel' ? 'Property' : 'Tour Guide'}:</span>
            <span style="display: block; font-size: 18px; color: #ffffff; margin-top: 4px;">
              ${reservation.bookingType === 'hotel' ? reservation.residenceId?.name : reservation.guideId?.name}
            </span>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
            <div style="width: 48%;">
              <span style="color: #888888; font-size: 14px; font-weight: 600;">Check-in:</span>
              <span style="display: block; font-size: 16px; color: #ffffff; margin-top: 4px;">${new Date(reservation.checkInDate).toLocaleDateString()}</span>
            </div>
            <div style="width: 48%;">
              <span style="color: #888888; font-size: 14px; font-weight: 600;">Check-out:</span>
              <span style="display: block; font-size: 16px; color: #ffffff; margin-top: 4px;">${new Date(reservation.checkOutDate).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div style="margin-top: 24px; padding-top: 24px; border-top: 1px dashed #444;">
            <span style="color: #888888; font-size: 14px; font-weight: 600;">Total Paid:</span>
            <span style="display: block; font-size: 28px; color: #5c8aff; font-weight: 800; margin-top: 8px;">LKR ${Number(reservation.totalPrice).toLocaleString()}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
          <h2 style="color: #2ecc71; font-size: 24px; margin-bottom: 12px;">Confirmed Successfully!</h2>
          <p style="color: #888888; font-size: 15px; line-height: 1.5;">
            Thank you for choosing Horizon Tourism. Your booking is now secured. We look forward to seeing you!
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #333; color: #555555; font-size: 12px;">
          &copy; 2026 Horizon Tourism Management. All rights reserved.
        </div>
      </div>
    `;

    // Send Confirmation Email in background (don't await)
    sendEmail({
      email: reservation.userId?.email || reservation.email,
      subject: `Booking Confirmed - ${reservation.bookingType === 'hotel' ? reservation.residenceId?.name : reservation.guideId?.name}`,
      html
    }).catch(err => console.error('Auto Confirm Email Error:', err));
  } catch (err) {
    console.error('Email preparation error:', err);
  }

  res.status(200).json({
    success: true,
    data: reservation
  });
});

// @desc      Send Receipt Email (Finance Manager)
// @route     POST /api/reservations/:id/send-receipt
// @access    Private (Admin, payment_manager)
exports.sendReceipt = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id).populate('userId residenceId guideId');

  if (!reservation) {
    return next(new ErrorResponse(`Reservation not found with id of ${req.params.id}`, 404));
  }

  let html = '';
  let subject = '';

  if (reservation.status === 'Confirmed') {
    subject = `Booking Confirmed - ${reservation.bookingType === 'hotel' ? reservation.residenceId?.name : reservation.guideId?.name}`;
    html = `
      <div style="background-color: #121212; padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff; border-radius: 24px; max-width: 600px; margin: auto;">
        <div style="text-align: center;">
          <h1 style="color: #5c8aff; font-size: 32px; margin-bottom: 8px; font-weight: 800;">Horizon Tourism</h1>
          <p style="color: #888888; font-size: 16px; margin-top: 0;">Booking Confirmation Receipt</p>
        </div>
        
        <div style="background-color: #1e1e1e; padding: 32px; border-radius: 20px; margin-top: 32px; border: 1px solid #333;">
          <h2 style="margin-top: 0; font-size: 22px; color: #ffffff; margin-bottom: 24px; border-bottom: 1px solid #333; padding-bottom: 12px;">Reservation Details</h2>
          
          <div style="margin-bottom: 16px;">
            <span style="color: #888888; font-size: 14px; font-weight: 600;">Customer Name:</span>
            <span style="display: block; font-size: 18px; color: #ffffff; margin-top: 4px;">${reservation.fullName}</span>
          </div>

          <div style="margin-bottom: 16px;">
            <span style="color: #888888; font-size: 14px; font-weight: 600;">${reservation.bookingType === 'hotel' ? 'Property' : 'Tour Guide'}:</span>
            <span style="display: block; font-size: 18px; color: #ffffff; margin-top: 4px;">
              ${reservation.bookingType === 'hotel' ? reservation.residenceId?.name : reservation.guideId?.name}
            </span>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
            <div style="width: 48%;">
              <span style="color: #888888; font-size: 14px; font-weight: 600;">Check-in:</span>
              <span style="display: block; font-size: 16px; color: #ffffff; margin-top: 4px;">${new Date(reservation.checkInDate).toLocaleDateString()}</span>
            </div>
            <div style="width: 48%;">
              <span style="color: #888888; font-size: 14px; font-weight: 600;">Check-out:</span>
              <span style="display: block; font-size: 16px; color: #ffffff; margin-top: 4px;">${new Date(reservation.checkOutDate).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div style="margin-top: 24px; padding-top: 24px; border-top: 1px dashed #444;">
            <span style="color: #888888; font-size: 14px; font-weight: 600;">Total Paid:</span>
            <span style="display: block; font-size: 28px; color: #5c8aff; font-weight: 800; margin-top: 8px;">LKR ${Number(reservation.totalPrice).toLocaleString()}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
          <h2 style="color: #2ecc71; font-size: 24px; margin-bottom: 12px;">Confirmed Successfully!</h2>
          <p style="color: #888888; font-size: 15px; line-height: 1.5;">
            Thank you for choosing Horizon Tourism. We look forward to seeing you!
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #333; color: #555555; font-size: 12px;">
          &copy; 2026 Horizon Tourism Management. All rights reserved.
        </div>
      </div>
    `;
  } else if (reservation.status === 'Rejected') {
    subject = `Booking Update - Request Declined - ${reservation.bookingType === 'hotel' ? reservation.residenceId?.name : reservation.guideId?.name}`;
    html = `
      <div style="background-color: #121212; padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff; border-radius: 24px; max-width: 600px; margin: auto;">
        <div style="text-align: center;">
          <h1 style="color: #ff5c5c; font-size: 32px; margin-bottom: 8px; font-weight: 800;">Horizon Tourism</h1>
          <p style="color: #888888; font-size: 16px; margin-top: 0;">Booking Update</p>
        </div>
        
        <div style="background-color: #1e1e1e; padding: 32px; border-radius: 20px; margin-top: 32px; border: 1px solid #333;">
          <h2 style="margin-top: 0; font-size: 22px; color: #ffffff; margin-bottom: 24px;">Booking Request Declined</h2>
          <p style="color: #bbbbbb; font-size: 16px; line-height: 1.6;">
            Dear ${reservation.fullName || 'Customer'},
          </p>
          <p style="color: #bbbbbb; font-size: 16px; line-height: 1.6;">
            We regret to inform you that your booking request for 
            <strong style="color: #ffffff;">${reservation.bookingType === 'hotel' ? reservation.residenceId?.name : reservation.guideId?.name}</strong> 
            has been declined by our finance department.
          </p>
          
          <div style="margin-top: 24px; padding: 20px; background-color: rgba(255, 92, 92, 0.1); border-radius: 12px; border: 1px solid rgba(255, 92, 92, 0.2);">
            <p style="margin: 0; color: #ff5c5c; font-weight: 600;">Status: Rejected</p>
            <p style="margin: 8px 0 0 0; color: #888888; font-size: 13px;">Reason: Information discrepancy or unavailable slot.</p>
          </div>
        </div>
        
        <p style="text-align: center; color: #888888; font-size: 14px; margin-top: 32px;">
          For further inquiries, please contact our support team.
        </p>
        
        <div style="text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #333; color: #555555; font-size: 12px;">
          &copy; 2026 Horizon Tourism Management. All rights reserved.
        </div>
      </div>
    `;
  } else {
    return next(new ErrorResponse('This booking is still pending and cannot be emailed yet.', 400));
  }

  // Send Email in background
  sendEmail({
    email: reservation.userId?.email || reservation.email,
    subject,
    html
  }).catch(err => console.error('Manual Email Error:', err));

  res.status(200).json({ success: true, data: 'Email sending initiated' });
});

// @desc    Update reservation
// @route   PUT /api/reservations/:id
// @access  Private
exports.updateReservation = asyncHandler(async (req, res, next) => {
  let reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    return next(new ErrorResponse(`Reservation not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is reservation owner or admin/manager
  if (reservation.userId.toString() !== req.user.id && 
      req.user.role !== 'admin' && 
      req.user.role !== 'reservation_manager') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this reservation`, 401));
  }

  // Prevent price editing
  delete req.body.totalPrice;
  delete req.body.price;

  reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: reservation });
});

// @desc    Reject reservation
// @route   PUT /api/reservations/:id/reject
// @access  Private (Admin, payment_manager)
exports.rejectReservation = asyncHandler(async (req, res, next) => {
  let reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    return next(new ErrorResponse(`Reservation not found with id of ${req.params.id}`, 404));
  }

  reservation = await Reservation.findByIdAndUpdate(
    req.params.id,
    { status: 'Rejected' },
    { new: true, runValidators: true }
  ).populate('userId residenceId guideId');

  // Send Rejection Email
  try {
    const html = `
      <div style="background-color: #121212; padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff; border-radius: 24px; max-width: 600px; margin: auto;">
        <div style="text-align: center;">
          <h1 style="color: #ff5c5c; font-size: 32px; margin-bottom: 8px; font-weight: 800;">Horizon Tourism</h1>
          <p style="color: #888888; font-size: 16px; margin-top: 0;">Booking Update</p>
        </div>
        
        <div style="background-color: #1e1e1e; padding: 32px; border-radius: 20px; margin-top: 32px; border: 1px solid #333;">
          <h2 style="margin-top: 0; font-size: 22px; color: #ffffff; margin-bottom: 24px;">Booking Request Declined</h2>
          <p style="color: #bbbbbb; font-size: 16px; line-height: 1.6;">
            Dear ${reservation.fullName || 'Customer'},
          </p>
          <p style="color: #bbbbbb; font-size: 16px; line-height: 1.6;">
            We regret to inform you that your booking request for 
            <strong style="color: #ffffff;">${reservation.bookingType === 'hotel' ? reservation.residenceId?.name : reservation.guideId?.name}</strong> 
            dated ${new Date(reservation.checkInDate).toLocaleDateString()} to ${new Date(reservation.checkOutDate).toLocaleDateString()} has been declined.
          </p>
          
          <div style="margin-top: 24px; padding: 20px; background-color: rgba(255, 92, 92, 0.1); border-radius: 12px; border: 1px solid rgba(255, 92, 92, 0.2);">
            <p style="margin: 0; color: #ff5c5c; font-weight: 600;">Status: Rejected by Finance Department</p>
            <p style="margin: 8px 0 0 0; color: #888888; font-size: 13px;">Reason: Resource unavailability or payment verification failure.</p>
          </div>
        </div>
        
        <p style="text-align: center; color: #888888; font-size: 14px; margin-top: 32px;">
          If you have already processed any advance payments, please contact our support for refund processing.
        </p>
        
        <div style="text-align: center; margin-top: 48px; padding-top: 24px; border-top: 1px solid #333; color: #555555; font-size: 12px;">
          &copy; 2026 Horizon Tourism Management. All rights reserved.
        </div>
      </div>
    `;

    // Send Rejection Email in background
    sendEmail({
      email: reservation.userId?.email || reservation.email,
      subject: `Booking Update - Request Declined - ${reservation.bookingType === 'hotel' ? reservation.residenceId?.name : reservation.guideId?.name}`,
      html
    }).catch(err => console.error('Error sending rejection email:', err));
  } catch (err) {
    console.error('Email preparation error:', err);
  }

  res.status(200).json({
    success: true,
    data: reservation
  });
});

// @desc    Delete reservation
// @route   DELETE /api/reservations/:id
// @access  Private
exports.deleteReservation = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    return next(new ErrorResponse(`Reservation not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is reservation owner or admin/manager
  if (reservation.userId.toString() !== req.user.id && 
      req.user.role !== 'admin' && 
      req.user.role !== 'reservation_manager' &&
      req.user.role !== 'payment_manager') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this reservation`, 401));
  }

  // If it was confirmed, make resource available again and remove payment record
  if (reservation.status === 'Confirmed') {
    if (reservation.bookingType === 'hotel' && reservation.residenceId) {
      await Residence.findByIdAndUpdate(reservation.residenceId, { availability: true });
    } else if (reservation.bookingType === 'guide' && reservation.guideId) {
      await TourGuide.findByIdAndUpdate(reservation.guideId, { availability: true });
    }
    await Payment.deleteMany({ reservationId: reservation._id });
  }

  await reservation.deleteOne();

  res.status(200).json({ success: true, data: {} });
});