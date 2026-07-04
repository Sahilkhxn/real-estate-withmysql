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
router.post('/list-property/upload-photos', (req, res, next) => {
  upload.array('photos', 5)(req, res, (err) => {
    if (err) {
      console.error('Multer/Cloudinary ERROR:', err.message, err.stack);
      return res.status(500).json({ success: false, error: err.message });
    }
    next();
  });
}, propertyController.uploadPropertyPhotos);

router.get('/about', (req, res) => {
  res.render('about', { title: 'About Us' });
});

router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact Us' });
});

router.get('/privacy-policy', (req, res) => {
  res.render('privacy-policy', { title: 'Privacy Policy' });
});

router.get('/terms-and-refund', (req, res) => {
  res.render('terms-and-refund', { title: 'Terms & Refund Policy' });
});

module.exports = router;