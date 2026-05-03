const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a driver name']
  },
  licenseNo: {
    type: String,
    required: [true, 'Please add a license number'],
    unique: true,
    sparse: true
  },
  idNo: {
    type: String,
    required: [true, 'Please add an ID number']
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number']
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  experience: {
    type: String,
    required: [true, 'Please add experience details']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  image: {
    type: String,
    default: 'default-driver.png'
  },
  available: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Driver', DriverSchema);
