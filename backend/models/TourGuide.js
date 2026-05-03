const mongoose = require('mongoose');

const TourGuideSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  idNumber: {
    type: String,
    required: [true, 'Please add an ID number']
  },
  email: {
    type: String,
    required: [true, 'Please add an email']
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    default: 'Male'
  },
  language: {
    type: [String],
    required: [true, 'Please add languages']
  },
  experience: {
    type: Number,
    required: [true, 'Please add experience in years']
  },
  description: {
    type: String
  },
  image: {
    type: String,
    default: 'no-photo.jpg'
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  availability: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TourGuide', TourGuideSchema);
