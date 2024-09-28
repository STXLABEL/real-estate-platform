const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route to register a user
router.post('/register', userController.registerUser);

// Route to verify a user's email
router.post('/verify', userController.verifyEmail);

// Request password reset
router.post('/request-password-reset', userController.requestPasswordReset);

// Reset password
router.post('/reset-password', userController.resetPassword);

router.post('/submit-biodata', userController.submitBiodata);
router.post('/submit-tier2-kyc', userController.submitTier2Kyc);
router.post('/submit-tier3-kyc', userController.submitTier3Kyc);
// Request phone verification OTP
router.post('/request-phone-verification', userController.requestPhoneVerification);

// Verify OTP code for phone number
router.post('/verify-phone', userController.verifyPhone);


module.exports = router;
