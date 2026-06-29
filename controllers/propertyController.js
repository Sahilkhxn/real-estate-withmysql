const nodemailer = require('nodemailer');
const Property = require('../models/Property');
const Enquiry = require('../models/Enquiry');

// Nodemailer transporter
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Escape special regex characters to prevent ReDoS attacks
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---- Homepage ----
exports.homepage = async (req, res) => {
  try {
    const { type, category, sort } = req.query;

    const filter = { status: 'available' };
    if (type) filter.type = type;
    if (category) filter.propertyCategory = category;

    const sortObj = sort === 'price_asc' ? { price: 1 }
                  : sort === 'price_desc' ? { price: -1 }
                  : { createdAt: -1 };

    const [properties, featured, totalProperties, availableCount] = await Promise.all([
      Property.find(filter).sort(sortObj).limit(12).lean(),
      Property.find({ featured: true, status: 'available' }).sort({ createdAt: -1 }).limit(3).lean(),
      Property.countDocuments({ status: 'available' }),
      Property.countDocuments({ status: 'available' })
    ]);

    const cities = await Property.distinct('location.city');

    res.render('index', {
      properties,
      featured,
      totalProperties,
      stats: { available: availableCount, cities: cities.length },
      query: req.query
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Something went wrong.' });
  }
};

// ---- Properties listing (paginated, filtered) ----
exports.listProperties = async (req, res) => {
  try {
    const { q, type, category, minPrice, maxPrice, sort, page = 1 } = req.query;
    const limit = 12;
    const skip = (Number(page) - 1) * limit;

    const filter = { status: 'available' };
    if (type) filter.type = type;
    if (category) filter.propertyCategory = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (q && q.trim()) {
      const safeQ = escapeRegex(q.trim().slice(0, 100));
      filter.$or = [
        { title:           { $regex: safeQ, $options: 'i' } },
        { 'location.area': { $regex: safeQ, $options: 'i' } },
        { 'location.city': { $regex: safeQ, $options: 'i' } },
        { description:     { $regex: safeQ, $options: 'i' } }
      ];
    }

    const sortObj = sort === 'price_asc' ? { price: 1 }
                  : sort === 'price_desc' ? { price: -1 }
                  : { createdAt: -1 };

    const [properties, total] = await Promise.all([
      Property.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
      Property.countDocuments(filter)
    ]);

    res.render('properties', {
      properties,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      query: req.query
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Something went wrong.' });
  }
};

// ---- Single property detail ----
exports.propertyDetail = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      status: 'available'
    }).lean();

    if (!property) {
      return res.status(404).render('error', { message: 'Property not found or no longer available.' });
    }

    res.render('property-detail', { property });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Something went wrong.' });
  }
};

// ---- Enquiry form (AJAX) ----
exports.submitEnquiry = async (req, res) => {
  try {
    const { name, phone, email, message, propertyId } = req.body;

    if (!name || !phone || !message) {
      return res.status(400).json({ success: false, message: 'Name, phone and message are required.' });
    }

    const enquiry = new Enquiry({ name, phone, email, message, propertyId });
    await enquiry.save();

    // Property details dhundo
    const property = await Property.findById(propertyId).lean();

    // fire & forget — await nahi, user wait nahi karega
    if (property) {
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `New Enquiry for: ${property.title}`,
        html: `
          <h3>New Property Enquiry — Webjinny</h3>
          <p><b>Property:</b> ${property.title}</p>
          <p><b>Location:</b> ${property.location.area}, ${property.location.city}</p>
          <p><b>Enquiry From:</b> ${name}</p>
          <p><b>Phone:</b> ${phone}</p>
          <p><b>Email:</b> ${email || 'Not provided'}</p>
          <p><b>Message:</b> ${message}</p>
          <hr/>
          <p><b>Owner Contact:</b> ${property.contactNumber}</p>
        `,
      }).catch(err => console.error('Enquiry email error:', err));
    }

    res.json({ success: true, message: 'Enquiry submitted!' });

  } catch (err) {
    console.error('Enquiry error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit enquiry.' });
  }
};

// ---- User Property Listing Page ----
exports.listPropertyPage = (req, res) => {
  res.render('list-property', { error: null, success: null });
};

// ---- User Property Submit ----
exports.submitUserProperty = async (req, res) => {
  try {
    console.log('Form data:', req.body); // ADD THIS
    console.log('Files:', req.files); 
    const { name, phone, title, description, price, priceType, type, propertyCategory, locationArea, city, state, pincode, bedrooms, bathrooms, propArea, amenities, contactNumber, whatsappNumber } = req.body;

    if (!name || !phone || !title || !price || !type || !locationArea || !city || !contactNumber) {
      return res.render('list-property', { error: 'Please fill all required fields.', success: null });
    }

    const photos = req.files ? req.files.map(f => f.path) : [];

    const property = new Property({
      title: title.trim(),
      description: description || '',
      price: Number(price),
      priceType: priceType || 'total',
      type,
      propertyCategory: propertyCategory || 'apartment',
      status: 'pending',
      location: { area: locationArea.trim(), city: city.trim(), state: state || 'Rajasthan', pincode: pincode || '' },
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 0,
      area: propArea && propArea !== '' ? Number(propArea) : undefined,
      photos,
      contactNumber: contactNumber.trim(),
      whatsappNumber: whatsappNumber ? whatsappNumber.trim() : '',
      amenities: amenities ? amenities.split(',').map(a => a.trim()).filter(Boolean) : [],
      submittedBy: { name: name.trim(), phone: phone.trim() },
      isUserSubmitted: true
    });

    await property.save();

    // Email admin
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New Property Listing Request — ${title}`,
      html: `
        <h3>New Property Listing Request</h3>
        <p><b>Submitted by:</b> ${name} (${phone})</p>
        <p><b>Title:</b> ${title}</p>
        <p><b>Location:</b> ${locationArea}, ${city}, ${state}</p>
        <p><b>Price:</b> ₹${price}</p>
        <p><b>Type:</b> ${type}</p>
        <p>Login to admin panel to approve or reject.</p>
      `
    });

    res.render('list-property', { error: null, success: 'Your property has been submitted! We will review and publish it shortly.' });

  } catch (err) {
    console.error(err);
    res.render('list-property', { error: 'Failed to submit. Please try again.', success: null });
  }
};