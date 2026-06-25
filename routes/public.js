const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

router.get('/', propertyController.homepage);
router.get('/properties', propertyController.listProperties);
router.get('/property/:id', propertyController.propertyDetail);
router.post('/enquiry', express.json(), propertyController.submitEnquiry);

module.exports = router;
