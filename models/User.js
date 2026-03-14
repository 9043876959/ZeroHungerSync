const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['donor', 'ngo'],
    required: true
  },
  foodType: {
    type: String,
    trim: true,
    default: null
  },
  quantity: {
    type: Number,
    default: null
  },
  goodTill: {
    type: Date,
    default: null
  },
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  foodStatus: {
    type: String,
    enum: ['AVAILABLE', 'LOCKED', 'COLLECTED', null],
    default: null
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Soft delete: mark as deleted but keep record
userSchema.methods.softDelete = function () {
  this.isDeleted = true;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);

