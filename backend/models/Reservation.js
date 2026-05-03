const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  bookingType: {
    type: String,
    enum: ['hotel', 'guide'],
    required: true,
    default: 'hotel'
  },
  residenceId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Residence'
  },
  guideId: {
    type: mongoose.Schema.ObjectId,
    ref: 'TourGuide'
  },
  checkInDate: {
    type: Date,
    required: [true, 'Please add a check-in date']
  },
  checkOutDate: {
    type: Date,
    required: [true, 'Please add a check-out date']
  },
  fullName: String,
  idNumber: String,
  phone: String,
  email: String,
  adults: {
    type: Number,
    default: 1
  },
  children: {
    type: Number,
    default: 0
  },
  totalPrice: Number,
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Rejected'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Card', 'Cash'],
    default: 'Card'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Reservation', ReservationSchema);
