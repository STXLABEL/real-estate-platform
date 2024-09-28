const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Email Field
  email: {
    type: String,
    required: true,  // Email is mandatory for registration
    unique: true,
  },
  // Phone Field
  phone: {
    type: String,
    unique: true,
    sparse: true,  // Allows phone to be optional
  },

  // Password and Security
  password: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  referralCode: { type: String },
  uplineId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dateOfRegistration: { type: Date, default: Date.now },
  tier: { type: String, default: 'Tier 1' },

  // Biodata
  fullName: { type: String },
  dob: { type: Date },
  country: { type: String },
  state: { type: String },
  address: { type: String },
  gender: { type: String },
  isTier1Complete: { type: Boolean, default: false },

  // KYC for Tier 2 and 3
  idDocument: { type: String },
  isTier2Complete: { type: Boolean, default: false },
  utilityBill: { type: String },
  proofOfIncome: { type: String },
  isTier3Complete: { type: Boolean, default: false },

  // Password Reset Fields
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  // 2FA Settings
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorType: { type: String, enum: ['sms', 'authenticator', 'email'], default: 'sms' },
  knownDevices: [{ deviceId: String, lastLogin: Date }]
});

module.exports = mongoose.model('User', userSchema);
