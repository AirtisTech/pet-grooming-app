const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  groomerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  petName: {
    type: String,
    required: true
  },
  petType: {
    type: String,
    enum: ['dog', 'cat', 'other'],
    required: true
  },
  petSize: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra_large'],
    required: true
  },
  services: [{
    type: String,
    enum: ['bath', 'haircut', 'nail_trim', 'teeth_cleaning', 'ear_cleaning', 'flea_treatment', 'styling']
  }],
  petNotes: String,
  address: {
    street: String,
    city: String,
    district: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  scheduledDate: Date,
  scheduledTime: String,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  price: Number,
  deposit: Number,
  finalPrice: Number,
  rating: Number,
  review: String,
  customerReviewed: {
    type: Boolean,
    default: false
  },
  groomerReviewed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
