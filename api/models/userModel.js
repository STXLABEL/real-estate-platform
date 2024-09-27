const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  referralCode: { type: String }, // The referral code the user registers with
  uplineId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Upline ID if referral
  dateOfRegistration: { type: Date, default: Date.now },
  tier: { type: String, default: 'Tier 1' }, // Default tier is 1
  fullName: { type: String }, // Optional biodata
  phone: { type: String }, // Optional biodata
  country: { type: String }, // Optional biodata
  address: { type: String }  // Optional biodata
});

module.exports = mongoose.model('User', userSchema);
