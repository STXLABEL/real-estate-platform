const express = require('express');
const router = express.Router();
const emailTemplateController = require('../controllers/emailTemplateController');

// Routes to manage email templates
router.post('/create', emailTemplateController.createTemplate);
router.put('/update/:templateId', emailTemplateController.updateTemplate);
router.delete('/delete/:templateId', emailTemplateController.deleteTemplate);
router.get('/getAll', emailTemplateController.getAllTemplates);

module.exports = router;
