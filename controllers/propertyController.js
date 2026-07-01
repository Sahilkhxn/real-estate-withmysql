const nodemailer = require('nodemailer');
const Property = require('../models/Property');
const Enquiry = require('../models/Enquiry');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false }
});

// ---- Homepage ----
exports.homepage = async (req, res) => {
  try {
    const { type, category, sort } = req.query;
    const filters = { status: 'available' };
    if (type) filters.type = type;
    if (category) filters.propertyCategory = category;

    const [listResult, featuredResult, availableCount, cities] = await Promise.all([
      Property.getProperties(filters, { page: 1, limit: 12 }, sort),
      Property.getProperties({ featured: true, status: 'available' }, { page: 1, limit: 3 }),
      Property.countProperties({ status: 'available' }),
      Property.getDistinctCities({ status: 'available' })
    ]);

    res.render('index', {
      properties: listResult.properties,
      featured: featuredResult.properties,
      totalProperties: availableCount,
      stats: { available: availableCount, cities: cities.length },
      query: req.query
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { message: 'Something went wrong.' });
  }
};

// ---- Properties listing ----
exports.listProperties = async (req, res) => {
  try {
    const { q, type, category, minPrice, maxPrice, sort, page = 1 } = req.query;
    const limit = 12;

    const filters = { status: 'available' };
    if (type) filters.type = type;
    if (category) filters.propertyCategory = category;
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    if (q && q.trim()) filters.search = q.trim().slice(0, 100);

    const result = await Property.getProperties(filters, { page: Number(page), limit }, sort);

    res.render('properties', {
      properties: result.properties,
      total: result.total,
      currentPage: Number(page),
      totalPages: result.totalPages,
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
    const property = await Property.getPropertyById(req.params.id);
    if (!property || property.status !== 'available') {
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

    await Enquiry.createEnquiry({ name, phone, email, message, propertyId });

    const property = await Property.getPropertyById(propertyId);
    if (property) {
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: property.ownerEmail || process.env.ADMIN_EMAIL,
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

exports.submitUserProperty = async (req, res) => {
  try {
    const { name, phone, title, description, price, priceType, type, propertyCategory, locationArea, city, state, pincode, bedrooms, bathrooms, propArea, amenities, contactNumber, whatsappNumber, ownerEmail } = req.body;

    if (!name || !phone || !title || !price || !type || !locationArea || !city || !contactNumber) {
      return res.status(400).json({ success: false, error: 'Please fill all required fields.' });
    }

    // User "Sell" chunta hai to buyer-facing type 'buy' honi chahiye
    const savedType = type === 'sell' ? 'buy' : type;

    const areaVal = (() => {
      const val = Array.isArray(propArea) ? propArea.find(v => v !== '') : propArea;
      return val && val !== '' && !isNaN(Number(val)) ? Number(val) : undefined;
    })();

    const property = await Property.createProperty({
      title: title.trim(),
      description: description || '',
      price: Number(price),
      priceType: priceType || 'total',
      type: savedType,
      propertyCategory: propertyCategory || 'apartment',
      status: 'pending',
      location: { area: locationArea.trim(), city: city.trim(), state: state || 'Rajasthan', pincode: pincode || '' },
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 0,
      area: areaVal,
      photos: [],
      contactNumber: contactNumber.trim(),
      whatsappNumber: whatsappNumber ? whatsappNumber.trim() : '',
      ownerEmail: ownerEmail ? ownerEmail.trim() : '',
      amenities: amenities ? amenities.split(',').map(a => a.trim()).filter(Boolean) : [],
      submittedBy: { name: name.trim(), phone: phone.trim() },
      isUserSubmitted: true
    });

    res.json({ success: true, propertyId: property.id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to submit. Please try again.' });
  }
};

// ---- Photos Upload (AJAX — Cloudinary, alag request) ----
exports.uploadPropertyPhotos = async (req, res) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId) return res.status(400).json({ success: false, error: 'Property ID missing.' });

    const photos = req.files ? req.files.map(f => f.path) : [];
    if (photos.length > 0) {
      await Property.addPhotos(propertyId, photos);
    }
    res.json({ success: true, uploaded: photos.length });

  } catch (err) {
    console.error('Photo upload ERROR:', err.message);
    console.error('Photo upload STACK:', err.stack);
    res.status(500).json({ success: false, error: err.message || 'Photo upload failed.' });
  }
};