const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  foodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: null
  },
  distance: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'COLLECTED', 'EXPIRED'],
    default: 'PENDING'
  },
  type: {
    type: String,
    enum: ['NGO_ALERT', 'DONOR_CONFIRM'],
    default: 'NGO_ALERT'
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
