const express = require('express');
const router = express.Router();
const GlobalSettings = require('../models/globalSettingsModel');

// Get global email settings
router.get('/email-settings', async (req, res) => {
  try {
    const settings = await GlobalSettings.findOne();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update global email settings
router.put('/email-settings', async (req, res) => {
  const { emailHeader, emailFooter } = req.body;

  try {
    const updatedSettings = await GlobalSettings.findOneAndUpdate(
      {},
      { emailHeader, emailFooter },
      { new: true, upsert: true }  // Create if not exists
    );
    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
