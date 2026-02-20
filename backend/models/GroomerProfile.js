const mongoose = require('mongoose');

const groomerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: String,
  skills: [{
    type: String,
    enum: ['bath', 'haircut', 'nail_trim', 'teeth_cleaning', 'ear_cleaning', 'flea_treatment', 'styling']
  }],
  serviceAreas: [{
    city: String,
    districts: [String]
  }],
  availability: {
    monday: { enabled: Boolean, startTime: String, endTime: String },
    tuesday: { enabled: Boolean, startTime: String, endTime: String },
    wednesday: { enabled: Boolean, startTime: String, endTime: String },
    thursday: { enabled: Boolean, startTime: String, endTime: String },
    friday: { enabled: Boolean, startTime: String, endTime: String },
    saturday: { enabled: Boolean, startTime: String, endTime: String },
    sunday: { enabled: Boolean, startTime: String, endTime: String }
  },
  basePrice: Number,
  rating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  totalJobs: {
    type: Number,
    default: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  responseTime: {
    type: Number, // in minutes
    default: 60
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  images: [String] // Portfolio images
}, { timestamps: true });

module.exports = mongoose.model('GroomerProfile', groomerProfileSchema);
