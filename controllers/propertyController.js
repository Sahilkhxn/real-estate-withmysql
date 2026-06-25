const Property = require('../models/Property');

// Escape special regex characters to prevent ReDoS attacks
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---- Homepage ----
exports.homepage = async (req, res) => {
  try {
    const { type, category, sort } = req.query;

    // Public: sirf available properties dikhao — sold/rented HIDE
    const filter = { status: 'available' };
    if (type) filter.type = type;
    if (category) filter.propertyCategory = category;

    const sortObj = sort === 'price_asc' ? { price: 1 }
                  : sort === 'price_desc' ? { price: -1 }
                  : { createdAt: -1 };

    const [properties, featured, totalProperties, availableCount] = await Promise.all([
      Property.find(filter).sort(sortObj).limit(12).lean(),
      Property.find({ featured: true, status: 'available' }).sort({ createdAt: -1 }).limit(3).lean(),
      Property.countDocuments({ status: 'available' }), // count only available
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

    // Public: sirf available dikhao
    const filter = { status: 'available' };
    if (type) filter.type = type;
    if (category) filter.propertyCategory = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Regex escape — ReDoS protection
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
    // Sold/rented property detail bhi public ko mat dikhao
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
    console.log('Enquiry received:', { name, phone, email, message, propertyId });
    res.json({ success: true, message: 'Enquiry submitted!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit enquiry.' });
  }
};
