const Template = require('../models/templateModel');

// Create a new email template
exports.createTemplate = async (req, res) => {
  const { templateType, title, subject, body, isHtml, useGlobalHeaderFooter } = req.body;

  try {
    const newTemplate = new Template({ templateType, title, subject, body, isHtml, useGlobalHeaderFooter });
    await newTemplate.save();
    return res.status(201).json({ message: 'Template created successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Update an existing template
exports.updateTemplate = async (req, res) => {
  const { templateId } = req.params;
  const { title, subject, body, isHtml, useGlobalHeaderFooter } = req.body;

  try {
    const updatedTemplate = await Template.findByIdAndUpdate(templateId, { title, subject, body, isHtml, useGlobalHeaderFooter }, { new: true });
    return res.status(200).json({ message: 'Template updated successfully', template: updatedTemplate });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Delete a template
exports.deleteTemplate = async (req, res) => {
  const { templateId } = req.params;

  try {
    await Template.findByIdAndDelete(templateId);
    return res.status(200).json({ message: 'Template deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Get all templates
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await Template.find();
    return res.status(200).json({ templates });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};
