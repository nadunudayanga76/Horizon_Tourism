const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: false
  },
  userName: {
    type: String,
    required: true,
    default: 'Anonymous'
  },
  residenceId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Residence',
    required: false 
  },
  guideId: {
    type: mongoose.Schema.ObjectId,
    ref: 'TourGuide',
    required: false // Optional, for guide reviews
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating between 1 and 5'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, 'Please add a comment']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
