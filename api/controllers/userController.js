const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Template = require('../models/templateModel');
const GlobalSettings = require('../models/globalSettingsModel');

// Register a new user
exports.registerUser = async (req, res) => {
  const { email, password, referralCode } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification code (we'll limit it to 4 digits here)
    const verificationCode = crypto.randomInt(1000, 9999).toString();

    // Handle referral (optional)
    let uplineId = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        uplineId = referrer._id;
      }
    }

    // Create the user
    const newUser = new User({
      email,
      password: hashedPassword,
      verificationCode,
      uplineId,
    });

    await newUser.save();

    // Send verification email
    await sendVerificationEmail(email, verificationCode);

    return res.status(201).json({ message: 'User registered successfully. Please check your email to verify your account.' });
  } catch (error) {
    console.error('Error during registration:', error);  // Log the error for debugging
    return res.status(500).json({ message: 'Server error' });
  }
};

// Send verification email
const sendVerificationEmail = async (email, code) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,  // SMTP host from .env
    port: process.env.SMTP_PORT,  // SMTP port from .env
    secure: process.env.SMTP_SECURE === 'true',  // Use true for port 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,  // Your email user from .env
      pass: process.env.EMAIL_PASS,  // Your email password from .env
    },
  });

  // Fetch the email template from the database
  const template = await Template.findOne({ templateType: 'verification' });
  if (!template) throw new Error('Email template not found');

  let header = '';
  let footer = '';

  // Check if the template is using the global header/footer
  if (template.useGlobalHeaderFooter) {
    const globalSettings = await GlobalSettings.findOne();  // Fetch global settings
    if (globalSettings) {
      header = globalSettings.emailHeader;
      footer = globalSettings.emailFooter;
    }
  }

  // Replace placeholders in the email body
  const emailBody = template.body.replace('{{code}}', code);

  // Construct the final email content
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
