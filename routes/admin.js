const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Login / Logout
router.get('/login', adminController.loginPage);
router.post('/login', adminController.login);
router.get('/logout', adminController.logout);

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

module.exports = router;