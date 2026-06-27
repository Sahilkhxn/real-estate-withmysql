const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  resetOTP: { type: String, default: null },
  resetOTPExpiry: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

// Auto-generate username before save
adminSchema.pre('save', async function(next) {
  if (!this.username) {
    const digits = Math.floor(100000 + Math.random() * 900000);
    this.username = `${digits}admin`;
  }
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);