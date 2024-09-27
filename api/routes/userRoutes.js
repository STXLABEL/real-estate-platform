const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route to register a user
router.post('/register', userController.registerUser);

module.exports = router;
