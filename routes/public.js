const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const upload = require('../middleware/upload');
const csrf = require('csurf');

const csrfProtection = csrf({ cookie: true });

router.get('/', csrfProtection, propertyController.homepage);
router.get('/properties', csrfProtection, propertyController.listProperties);
router.get('/property/:id', csrfProtection, propertyController.propertyDetail);
router.post('/enquiry', express.json(), propertyController.submitEnquiry);
router.get('/list-property', csrfProtection, propertyController.listPropertyPage);
router.post('/list-property', upload.array('photos', 10), propertyController.submitUserProperty);

module.exports = router;