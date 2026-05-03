const mongoose = require('mongoose');

const TransportSchema = new mongoose.Schema({
  vehicleType: String,
  vehicleModel: String,
  vehicleNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  driverName: {
    type: String,
    default: 'TBA'
  },
  mobileNumber: String,
  location: String,
  image: {
    type: String,
    default: 'no-photo.jpg'
  },
  availability: {
    type: Boolean,
    default: true
  },
  maintenance: {
    type: Boolean,
    default: false
  },
  price: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transport', TransportSchema);
