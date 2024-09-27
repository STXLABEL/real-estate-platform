const mongoose = require('mongoose');

const globalSettingsSchema = new mongoose.Schema({
  emailHeader: { type: String, required: true },  // Global email header (HTML or text)
  emailFooter: { type: String, required: true },  // Global email footer (HTML or text)
});

module.exports = mongoose.model('GlobalSettings', globalSettingsSchema);
