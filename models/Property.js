const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  priceType: {
    type: String,
    enum: ['total', 'per_month', 'per_sqft'],
    default: 'total'
  },
  location: {
    area: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: 'Rajasthan' },
    pincode: { type: String }
  },
  type: {
    type: String,
    enum: ['buy', 'rent', 'sell'],
    required: true
  },
  propertyCategory: {
    type: String,
    enum: ['apartment', 'house', 'villa', 'plot', 'commercial', 'pg'],
    default: 'apartment'
  },
  bedrooms: { type: Number, default: 0 },
  bathrooms: { type: Number, default: 0 },
  area: { type: Number }, // sq ft
  photos: [{ type: String }],
  contactNumber: { type: String, required: true },
  whatsappNumber: { type: String },
  status: {
    type: String,
      enum: ['available', 'sold', 'rented', 'pending'],

    default: 'available'
  },

  submittedBy: {
  name: { type: String },
  phone: { type: String }
},
isUserSubmitted: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  amenities: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update updatedAt on save
propertySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Text search index
propertySchema.index({ title: 'text', description: 'text', 'location.area': 'text', 'location.city': 'text' });

module.exports = mongoose.model('Property', propertySchema);
