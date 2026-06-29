const Admin = require('../models/Admin');
const Property = require('../models/Property');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
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

//     exports.login = async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     console.log('Login attempt:', username, password);
//     const admin = await Admin.findOne({ username });
//     console.log('Admin found:', admin);
//     if (!admin) return res.render('admin/login', { error: 'Invalid username or password.', success: null });
//     const isValid = await admin.comparePassword(password);
//     console.log('Password valid:', isValid);
//     if (!isValid) return res.render('admin/login', { error: 'Invalid username or password.', success: null });
//     const token = jwt.sign({ id: admin._id, username: admin.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
//     res.redirect('/admin/dashboard');
//   } catch (err) {
//     console.error(err);res.cookie('adminToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 });
//     res.render('admin/login', { error: 'Login failed.', success: null });
//   }
// };

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.render('admin/login', { error: 'Invalid username or password.', success: null });
    const isValid = await admin.comparePassword(password);
    if (!isValid) return res.render('admin/login', { error: 'Invalid username or password.', success: null });
    const token = jwt.sign({ id: admin._id, username: admin.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.cookie('adminToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 });
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
    const filter = { status: { $ne: 'pending' } };
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
    res.render('admin/properties', {
      properties,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      query: req.query,
      flashSuccess: req.query.success,
      flashError: null
    });
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
  // const propArea     = body.propArea ? Number(body.propArea) : undefined;
  const propArea = body.propArea && body.propArea !== '' && !isNaN(Number(body.propArea)) ? Number(body.propArea) : undefined;

  // f.path = Cloudinary full URL (https://res.cloudinary.com/...)
  const newPhotos  = files ? files.map(f => f.path) : [];
  const keptPhotos = existingPhotos
    ? (Array.isArray(existingPhotos) ? existingPhotos : [existingPhotos])
    : [];
  const allPhotos  = [...keptPhotos, ...newPhotos];

  return {
    title:            String(body.title       || '').trim(),
    description:      String(body.description || '').trim(),
    price:            Number(body.price)      || 0,
    priceType:        body.priceType          || 'total',
    type:             body.type,
    propertyCategory: body.propertyCategory   || 'apartment',
    status:           body.status             || 'available',
    location:         { area: locationArea, city, state, pincode },
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
    console.log('BODY:', JSON.stringify(req.body));
    console.log('FILES:', req.files ? req.files.length : 0);
    const data = buildPropertyData(req.body, req.files, null);
    console.log('DATA:', JSON.stringify(data));
    const property = new Property(data);
    await property.save();
    res.redirect('/admin/properties?success=Property+added+successfully!');
  } catch (err) {
    console.error('CREATE ERROR:', err.message);
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

    const keptPhotos = req.body.existingPhotos
      ? (Array.isArray(req.body.existingPhotos) ? req.body.existingPhotos : [req.body.existingPhotos])
      : [];

    // Note: Cloudinary photos — local fs.unlink not needed
    // Removed photos are simply excluded from keptPhotos array

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
    // Note: Cloudinary photos cleanup skipped (URLs stored, not local files)
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
// ---- Forgot Password Page ----
exports.forgotPasswordPage = (req, res) => {
  res.render('admin/forgot-password', { error: null, success: null });
};

// ---- Send OTP ----
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.render('admin/forgot-password', { error: 'No admin found with this email.', success: null });

    // Generate 6 digit OTP
    
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    admin.resetOTP = otp;
    admin.resetOTPExpiry = expiry;
    await admin.save();

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Webjinny Admin — Password Reset OTP',
      html: `
        <h3>Password Reset OTP</h3>
        <p>Your OTP is: <b style="font-size:1.5rem">${otp}</b></p>
        <p>Valid for 10 minutes only.</p>
        <p>If you didn't request this, ignore this email.</p>
      `
    });

    res.redirect(`/admin/verify-otp?email=${encodeURIComponent(email)}`);
  } catch (err) {
    console.error(err);
    res.render('admin/forgot-password', { error: 'Failed to send OTP.', success: null });
  }
};

// ---- Verify OTP Page ----
exports.verifyOTPPage = (req, res) => {
  res.render('admin/verify-otp', { error: null, email: req.query.email });
};

// ---- Verify OTP ----
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin || admin.resetOTP !== otp || admin.resetOTPExpiry < new Date()) {
      return res.render('admin/verify-otp', { error: 'Invalid or expired OTP.', email });
    }

    res.redirect(`/admin/reset-password?email=${encodeURIComponent(email)}&otp=${otp}`);
  } catch (err) {
    console.error(err);
    res.render('admin/verify-otp', { error: 'Something went wrong.', email: req.body.email });
  }
};

// ---- Reset Password Page ----
exports.resetPasswordPage = (req, res) => {
  res.render('admin/reset-password', { error: null, email: req.query.email, otp: req.query.otp });
};

// ---- Reset Password ----
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render('admin/reset-password', { error: 'Passwords do not match.', email, otp });
    }
    if (password.length < 6) {
      return res.render('admin/reset-password', { error: 'Password must be at least 6 characters.', email, otp });
    }

    const admin = await Admin.findOne({ email });
    if (!admin || admin.resetOTP !== otp || admin.resetOTPExpiry < new Date()) {
      return res.render('admin/reset-password', { error: 'Invalid or expired OTP.', email, otp });
    }

    admin.password = password;
    admin.resetOTP = null;
    admin.resetOTPExpiry = null;
    await admin.save();

    res.redirect('/admin/login?success=Password+reset+successfully!');
  } catch (err) {
    console.error(err);
    res.render('admin/reset-password', { error: 'Failed to reset password.', email: req.body.email, otp: req.body.otp });
  }
};

// ---- Forgot Username Page ----
exports.forgotUsernamePage = (req, res) => {
  res.render('admin/forgot-username', { error: null, success: null });
};

// ---- Send Username ----
exports.sendUsername = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.render('admin/forgot-username', { error: 'No admin found with this email.', success: null });

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Webjinny Admin — Your Username',
      html: `
        <h3>Your Admin Username</h3>
        <p>Your username is: <b style="font-size:1.3rem">${admin.username}</b></p>
        <p>Use this to login at Webjinny Admin Panel.</p>
      `
    });

    res.render('admin/forgot-username', { error: null, success: 'Username sent to your email!' });
  } catch (err) {
    console.error(err);
    res.render('admin/forgot-username', { error: 'Failed to send username.', success: null });
  }
};

// ---- Pending Properties ----

exports.pendingProperties = async (req, res) => {
  try {
    const properties = await Property.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
    res.render('admin/pending', { 
      properties, 
      flashSuccess: req.query.success
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};

// ---- Approve Property ----
exports.approveProperty = async (req, res) => {
  try {
    await Property.findByIdAndUpdate(req.params.id, { status: 'available' });
    res.redirect('/admin/pending?success=Property+approved+successfully!');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/pending');
  }
};

// ---- Reject Property ----
exports.rejectProperty = async (req, res) => {
  try {
    await Property.findByIdAndDelete(req.params.id);
    res.redirect('/admin/pending?success=Property+rejected+and+deleted!');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/pending');
  }
};

// ---- Preview Pending Property ----
exports.previewProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).lean();
    if (!property) return res.status(404).render('error', { message: 'Property not found.' });
    res.render('property-detail', { property });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Something went wrong.' });
  }
};

