const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Template = require('../models/templateModel');
const GlobalSettings = require('../models/globalSettingsModel');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Register a new user
exports.registerUser = async (req, res) => {
  const { email, password, referralCode } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = crypto.randomInt(1000, 9999).toString();

    let uplineId = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        uplineId = referrer._id;
      }
    }

    const newUser = new User({
      email,
      password: hashedPassword,
      verificationCode,
      uplineId,
      isTier1Complete: false,
    });

    await newUser.save();
    await sendVerificationEmail(email, verificationCode);

    return res.status(201).json({ message: 'User registered successfully. Please check your email to verify your account.' });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Send verification email
const sendVerificationEmail = async (email, code) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const template = await Template.findOne({ templateType: 'verification' });
  if (!template) throw new Error('Email template not found');

  let header = '';
  let footer = '';

  if (template.useGlobalHeaderFooter) {
    const globalSettings = await GlobalSettings.findOne();
    if (globalSettings) {
      header = globalSettings.emailHeader;
      footer = globalSettings.emailFooter;
    }
  }

  const emailBody = template.body.replace('{{code}}', code);
  const finalBody = `${header}\n${emailBody}\n${footer}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: template.subject,
    html: template.isHtml ? finalBody : undefined,
    text: !template.isHtml ? finalBody : undefined,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent');
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Verify a user's email using the verification code
exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ email, verificationCode: code });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or verification code' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    user.isEmailVerified = true;
    user.verificationCode = null;  // Clear the verification code
    await user.save();

    return res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error during email verification:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpires = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken);

    return res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const template = await Template.findOne({ templateType: 'reset_password' });
  if (!template) throw new Error('Email template not found');

  let header = '';
  let footer = '';

  if (template.useGlobalHeaderFooter) {
    const globalSettings = await GlobalSettings.findOne();
    if (globalSettings) {
      header = globalSettings.emailHeader;
      footer = globalSettings.emailFooter;
    }
  }

  const resetUrl = `http://localhost:7001/reset-password/${token}`;
  const emailBody = template.body.replace('{{resetUrl}}', resetUrl);
  const finalBody = `${header}\n${emailBody}\n${footer}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: template.subject,
    html: template.isHtml ? finalBody : undefined,
    text: !template.isHtml ? finalBody : undefined,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent');
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Reset password with history check
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld) {
      return res.status(400).json({ message: 'New password cannot be the same as the old password' });
    }

    // Check against previous passwords
    for (let i = 0; i < user.previousPasswords.length; i++) {
      const match = await bcrypt.compare(newPassword, user.previousPasswords[i]);
      if (match) {
        return res.status(400).json({ message: 'New password cannot be the same as one of the previous passwords' });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.previousPasswords.push(user.password);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Submit Biodata for Tier 1
exports.submitBiodata = async (req, res) => {
  const { email, fullName, phone, dob, country, state, address, gender } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.fullName = fullName;
    user.phone = phone; // Keeping phone for KYC
    user.dob = dob;
    user.country = country;
    user.state = state;
    user.address = address;
    user.gender = gender;
    user.isTier1Complete = true;
    await user.save();

    return res.status(200).json({ message: 'Biodata submitted successfully. Tier 1 activated.' });
  } catch (error) {
    console.error('Error during biodata submission:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Submit Tier 2 KYC
exports.submitTier2Kyc = async (req, res) => {
  const { email, phone, idDocument } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.phone = phone; // Keeping phone for KYC
    user.idDocument = idDocument; // Save the ID document
    user.phoneVerified = true; // Assuming phone verification is handled externally
    user.isTier2Complete = true;

    await user.save();

    return res.status(200).json({ message: 'Tier 2 KYC completed successfully' });
  } catch (error) {
    console.error('Error during Tier 2 KYC submission:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Submit Tier 3 KYC
exports.submitTier3Kyc = async (req, res) => {
  const { email, utilityBill, proofOfIncome } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.utilityBill = utilityBill; // Save utility bill
    user.proofOfIncome = proofOfIncome; // Save proof of income
    user.isTier3Complete = true;

    await user.save();

    return res.status(200).json({ message: 'Tier 3 KYC completed successfully' });
  } catch (error) {
    console.error('Error during Tier 3 KYC submission:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Request phone verification (send OTP)
exports.requestPhoneVerification = async (req, res) => {
  const { phone } = req.body;

  try {
    const verification = await client.verify.services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({ to: phone, channel: 'sms' });

    return res.status(200).json({ message: 'OTP sent successfully', sid: verification.sid });
  } catch (error) {
    console.error('Error requesting phone verification:', error);
    return res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// Verify the OTP code
exports.verifyPhone = async (req, res) => {
  const { phone, code } = req.body;

  try {
    const verificationCheck = await client.verify.services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks
      .create({ to: phone, code });

    if (verificationCheck.status === 'approved') {
      return res.status(200).json({ message: 'Phone number verified successfully' });
    } else {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
  } catch (error) {
    console.error('Error verifying phone:', error);
    return res.status(500).json({ message: 'Failed to verify OTP' });
  }
};
