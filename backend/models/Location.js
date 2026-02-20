const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  type: {
    type: String,
    enum: ['groomer_tracking', 'customer_location', 'delivery'],
    default: 'groomer_tracking'
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  address: String,
  accuracy: Number,
  speed: Number,
  heading: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for efficient queries
locationSchema.index({ userId: 1, timestamp: -1 });
locationSchema.index({ orderId: 1, timestamp: -1 });

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
