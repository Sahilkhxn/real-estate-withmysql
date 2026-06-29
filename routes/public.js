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
router.post('/list-property', express.urlencoded({ extended: true }), propertyController.submitUserProperty);           // upload hataya — AJAX urlencoded bhejta hai
router.post('/list-property/upload-photos', upload.array('photos', 5), propertyController.uploadPropertyPhotos);       // photos ke liye alag route

module.exports = router;