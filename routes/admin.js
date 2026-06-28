const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { otpLimiter } = require('../middleware/rateLimiter');
// Login / Logout
router.get('/login', adminController.loginPage);
router.post('/login', adminController.login);
router.get('/logout', adminController.logout);
// Forgot password
router.get('/forgot-password', adminController.forgotPasswordPage);
router.post('/forgot-password', adminController.sendOTP);
router.get('/verify-otp', adminController.verifyOTPPage);
router.post('/verify-otp', adminController.verifyOTP);
router.get('/reset-password', adminController.resetPasswordPage);
router.post('/reset-password', adminController.resetPassword);
router.get('/forgot-username', adminController.forgotUsernamePage);
router.post('/forgot-username', adminController.sendUsername);

// Protected routes
router.get('/dashboard', auth, adminController.dashboard);

// Properties CRUD
router.get('/properties', auth, adminController.listProperties);
router.get('/properties/new', auth, adminController.newPropertyForm);
router.post('/properties', auth, upload.array('photos', 10), adminController.createProperty);
router.get('/properties/:id/edit', auth, adminController.editPropertyForm);
router.put('/properties/:id', auth, upload.array('photos', 10), adminController.updateProperty);
router.delete('/properties/:id', auth, adminController.deleteProperty);

// AJAX status / featured toggles
router.patch('/properties/:id/status', auth, express.json(), adminController.updateStatus);
router.patch('/properties/:id/featured', auth, express.json(), adminController.toggleFeatured);
router.post('/verify-otp', otpLimiter, adminController.verifyOTP);
router.post('/forgot-password', otpLimiter, adminController.sendOTP);

module.exports = router;