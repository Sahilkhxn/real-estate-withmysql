const Admin = require('../models/Admin');
const Property = require('../models/Property');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Escape special regex chars to prevent ReDoS
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---- Login page ----
exports.loginPage = (req, res) => {
  if (req.cookies && req.cookies.adminToken) return res.redirect('/admin/dashboard');
  res.render('admin/login', { error: null, success: null });
};

// ---- Login POST ----
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.render('admin/login', { error: 'Invalid username or password.', success: null });
    const isValid = await admin.comparePassword(password);
    if (!isValid) return res.render('admin/login', { error: 'Invalid username or password.', success: null });
    const token = jwt.sign({ id: admin._id, username: admin.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.cookie('adminToken', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.render('admin/login', { error: 'Login failed.', success: null });
  }
};

// ---- Logout ----
exports.logout = (req, res) => {
  res.clearCookie('adminToken');
  res.redirect('/admin/login');
};

// ---- Dashboard ----
exports.dashboard = async (req, res) => {
  try {
    const [total, available, sold, featured, recentProperties] = await Promise.all([
      Property.countDocuments(),
      Property.countDocuments({ status: 'available' }),
      Property.countDocuments({ status: { $in: ['sold', 'rented'] } }),
      Property.countDocuments({ featured: true }),
      Property.find().sort({ createdAt: -1 }).limit(10).lean()
    ]);
    res.render('admin/dashboard', { stats: { total, available, sold, featured }, recentProperties, flashSuccess: req.query.success });
  } catch (err) {
    console.error(err);
    res.status(500).send('Dashboard error');
  }
};

// ---- List properties (admin) ----
exports.listProperties = async (req, res) => {
  try {
    const { q, status, type, page = 1 } = req.query;
    const limit = 20;
    const skip = (Number(page) - 1) * limit;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (q) {
      const safeQ = escapeRegex((q || "").trim().slice(0, 100));
      filter.$or = [
        { title: { $regex: safeQ, $options: 'i' } },
        { 'location.area': { $regex: safeQ, $options: 'i' } },
        { 'location.city': { $regex: safeQ, $options: 'i' } }
      ];
    }
    const [properties, total] = await Promise.all([
      Property.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Property.countDocuments(filter)
    ]);
    res.render('admin/properties', { properties, total, currentPage: Number(page), totalPages: Math.ceil(total / limit), query: req.query, flashSuccess: req.query.success, flashError: null });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

// ---- New property form ----
exports.newPropertyForm = (req, res) => {
  res.render('admin/property-form', {
    isEdit: false,
    property: { location: { area: '', city: 'Jaipur', state: 'Rajasthan', pincode: '' } },
    flashError: null
  });
};

// Helper to build property data from form body
function buildPropertyData(body, files, existingPhotos) {
  const locationArea = String(body.locationArea || '').trim();
  const city         = String(body.city         || '').trim();
  const state        = String(body.state        || 'Rajasthan').trim();
  const pincode      = String(body.pincode      || '').trim();
  const propArea     = body.propArea ? Number(body.propArea) : undefined;
  const newPhotos    = files ? files.map(f => f.filename) : [];
  const keptPhotos   = existingPhotos
    ? (Array.isArray(existingPhotos) ? existingPhotos : [existingPhotos])
    : [];
  const allPhotos    = [...keptPhotos, ...newPhotos];

  return {
    title:            String(body.title       || '').trim(),
    description:      String(body.description || '').trim(),
    price:            Number(body.price)      || 0,
    priceType:        body.priceType          || 'total',
    type:             body.type,
    propertyCategory: body.propertyCategory   || 'apartment',
    status:           body.status             || 'available',
    location: { area: locationArea, city, state, pincode },
    bedrooms:         Number(body.bedrooms)   || 0,
    bathrooms:        Number(body.bathrooms)  || 0,
    area:             propArea,
    photos:           allPhotos,
    contactNumber:    String(body.contactNumber  || '').trim(),
    whatsappNumber:   String(body.whatsappNumber || '').trim(),
    featured:         body.featured === 'true' || body.featured === 'on',
    amenities:        body.amenities
                        ? body.amenities.split(',').map(a => a.trim()).filter(Boolean)
                        : []
  };
}

// Error view helper
function errorForm(res, isEdit, body, message) {
  res.render('admin/property-form', {
    isEdit,
    property: {
      ...body,
      location: {
        area:    body.locationArea || '',
        city:    body.city         || '',
        state:   body.state        || 'Rajasthan',
        pincode: body.pincode      || ''
      }
    },
    flashError: message
  });
}

// ---- Create property ----
exports.createProperty = async (req, res) => {
  try {
    const data = buildPropertyData(req.body, req.files, null);
    const property = new Property(data);
    await property.save();
    res.redirect('/admin/properties?success=Property+added+successfully!');
  } catch (err) {
    console.error(err);
    if (req.files) req.files.forEach(f => fs.unlink(f.path, () => {}));
    errorForm(res, false, req.body, 'Failed to create: ' + err.message);
  }
};

// ---- Edit property form ----
exports.editPropertyForm = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).lean();
    if (!property) return res.redirect('/admin/properties');
    res.render('admin/property-form', { isEdit: true, property, flashError: null });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/properties');
  }
};

// ---- Update property ----
exports.updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.redirect('/admin/properties');

    // Delete removed photos
    const keptPhotos = req.body.existingPhotos
      ? (Array.isArray(req.body.existingPhotos) ? req.body.existingPhotos : [req.body.existingPhotos])
      : [];
    property.photos
      .filter(p => !keptPhotos.includes(p))
      .forEach(filename => fs.unlink(path.join(__dirname, '../public/uploads', filename), () => {}));

    const data = buildPropertyData(req.body, req.files, keptPhotos);

    Object.assign(property, data);
    property.updatedAt = Date.now();
    await property.save();
    res.redirect('/admin/properties?success=Property+updated+successfully!');
  } catch (err) {
    console.error(err);
    errorForm(res, true, { ...req.body, _id: req.params.id }, 'Failed to update: ' + err.message);
  }
};

// ---- Delete property (AJAX) ----
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id);
    if (!property) return res.json({ success: false, message: 'Not found' });
    property.photos.forEach(f => fs.unlink(path.join(__dirname, '../public/uploads', f), () => {}));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---- Update status (AJAX) ----
exports.updateStatus = async (req, res) => {
  try {
    await Property.findByIdAndUpdate(req.params.id, { status: req.body.status, updatedAt: Date.now() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---- Toggle featured (AJAX) ----
exports.toggleFeatured = async (req, res) => {
  try {
    await Property.findByIdAndUpdate(req.params.id, { featured: req.body.featured, updatedAt: Date.now() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
