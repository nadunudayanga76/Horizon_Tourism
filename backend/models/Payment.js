const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount']
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  },
  date: {
    type: Date,
    default: Date.now
  },
  reservationId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Reservation'
  },
  transportBookingId: {
    type: mongoose.Schema.ObjectId,
    ref: 'TransportBooking'
  }
});

module.exports = mongoose.model('Payment', PaymentSchema);
