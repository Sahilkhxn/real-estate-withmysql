const nodemailer = require('nodemailer');
const Property = require('../models/Property');
const Enquiry = require('../models/Enquiry');

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
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

    // MongoDB mein save karo
    const enquiry = new Enquiry({ name, phone, email, message, propertyId });
    await enquiry.save();
    console.log('Enquiry saved:', enquiry);

    // Email bhejo admin ko
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New Property Enquiry - ${name}`,
      html: `
        <h3>New Enquiry Received - Webjinny</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Email:</b> ${email || 'Not provided'}</p>
        <p><b>Message:</b> ${message}</p>
        <p><b>Property ID:</b> ${propertyId}</p>
      `,
    });

    res.json({ success: true, message: 'Enquiry submitted!' });

  } catch (err) {
    console.error('Enquiry error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit enquiry.' });
  }
};