const express = require('express');
const router = express.Router();
const Template = require('../models/templateModel');

// Get all email templates
router.get('/email-templates', async (req, res) => {
  try {
    const templates = await Template.find();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update or create an email template
router.post('/email-templates', async (req, res) => {
  const { templateType, title, subject, body, isHtml, useGlobalHeaderFooter } = req.body;

  try {
    const updatedTemplate = await Template.findOneAndUpdate(
      { templateType },
      { title, subject, body, isHtml, useGlobalHeaderFooter },
      { new: true, upsert: true }  // Create if not exists
    );
    res.json(updatedTemplate);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
