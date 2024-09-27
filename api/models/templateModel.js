const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  templateType: { type: String, required: true, unique: true },  // e.g., 'verification', 'reset_password'
  title: { type: String, required: true },  // Title of the email template
  subject: { type: String, required: true },  // Email subject
  body: { type: String, required: true },  // Email body (plain text or HTML)
  isHtml: { type: Boolean, default: true },  // True if the template is in HTML
  useGlobalHeaderFooter: { type: Boolean, default: true },  // Option to use global header and footer
});

module.exports = mongoose.model('Template', templateSchema);
