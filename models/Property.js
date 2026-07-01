// models/Property.js
const { pool } = require('../db');

function isValidPincode(v) {
  return !v || /^\d{6}$/.test(v);
}
function isValidContactNumber(v) {
  return /^\d{10}$/.test(v);
}

// Maps a DB row (snake_case) -> app-friendly object (camelCase, nested
// location/submittedBy), with an `_id` alias so views written for
// MongoDB (which expect `property._id`) keep working unchanged.
function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id, // compatibility alias
    title: row.title,
    description: row.description,
    price: row.price,
    priceType: row.price_type,
    location: {
      area: row.location_area,
      city: row.location_city,
      state: row.location_state,
      pincode: row.location_pincode
    },
    type: row.type,
    propertyCategory: row.property_category,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    area: row.area,
    photos: typeof row.photos === 'string' ? JSON.parse(row.photos) : (row.photos || []),
    amenities: typeof row.amenities === 'string' ? JSON.parse(row.amenities) : (row.amenities || []),
    contactNumber: row.contact_number,
    whatsappNumber: row.whatsapp_number,
    ownerEmail: row.owner_email,
    status: row.status,
    submittedBy: {
      name: row.submitted_by_name,
      phone: row.submitted_by_phone
    },
    isUserSubmitted: !!row.is_user_submitted,
    featured: !!row.featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Builds a WHERE clause + params array from a filters object. Shared by
// getProperties/countProperties so the two stay in sync.
//
// Supported filters:
//   type, propertyCategory, city, status, statusNotIn (array),
//   featured (bool), minPrice, maxPrice,
//   search (string -> LIKE across title/description/location)
function buildWhereClause(filters = {}) {
  const conditions = [];
  const params = [];

  if (filters.type) {
    conditions.push('type = ?');
    params.push(filters.type);
  }
  if (filters.propertyCategory) {
    conditions.push('property_category = ?');
    params.push(filters.propertyCategory);
  }
  if (filters.city) {
    conditions.push('location_city = ?');
    params.push(filters.city);
  }
  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.statusNotIn && filters.statusNotIn.length) {
    conditions.push(`status NOT IN (${filters.statusNotIn.map(() => '?').join(',')})`);
    params.push(...filters.statusNotIn);
  }
  if (filters.featured !== undefined) {
    conditions.push('featured = ?');
    params.push(filters.featured ? 1 : 0);
  }
  if (filters.minPrice) {
    conditions.push('price >= ?');
    params.push(filters.minPrice);
  }
  if (filters.maxPrice) {
    conditions.push('price <= ?');
    params.push(filters.maxPrice);
  }
  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      '(title LIKE ? OR description LIKE ? OR location_area LIKE ? OR location_city LIKE ?)'
    );
    params.push(term, term, term, term);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

function sortClause(sort) {
  if (sort === 'price_asc') return 'ORDER BY price ASC';
  if (sort === 'price_desc') return 'ORDER BY price DESC';
  return 'ORDER BY created_at DESC';
}

async function createProperty(data) {
  if (!isValidPincode(data.location?.pincode)) {
    throw new Error('Pincode must be exactly 6 digits');
  }
  if (!isValidContactNumber(data.contactNumber)) {
    throw new Error('Contact number must be exactly 10 digits');
  }

  const [result] = await pool.query(
    `INSERT INTO properties
      (title, description, price, price_type,
       location_area, location_city, location_state, location_pincode,
       type, property_category, bedrooms, bathrooms, area,
       photos, amenities, contact_number, whatsapp_number, owner_email,
       status, submitted_by_name, submitted_by_phone, is_user_submitted, featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.description || '',
      data.price,
      data.priceType || 'total',
      data.location?.area,
      data.location?.city,
      data.location?.state || 'Rajasthan',
      data.location?.pincode || null,
      data.type,
      data.propertyCategory || 'apartment',
      data.bedrooms || 0,
      data.bathrooms || 0,
      data.area || null,
      JSON.stringify(data.photos || []),
      JSON.stringify(data.amenities || []),
      data.contactNumber,
      data.whatsappNumber || null,
      data.ownerEmail || '',
      data.status || 'available',
      data.submittedBy?.name || null,
      data.submittedBy?.phone || null,
      data.isUserSubmitted || false,
      data.featured || false
    ]
  );

  return getPropertyById(result.insertId);
}

async function getPropertyById(id) {
  const [rows] = await pool.query('SELECT * FROM properties WHERE id = ?', [id]);
  return mapRow(rows[0]);
}

// filters: see buildWhereClause. pagination: { page, limit }. sort: 'price_asc'|'price_desc'|undefined
async function getProperties(filters = {}, pagination = {}, sort) {
  const { whereClause, params } = buildWhereClause(filters);

  const page = pagination.page || 1;
  const limit = pagination.limit || 20;
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT * FROM properties ${whereClause} ${sortClause(sort)} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const total = await countProperties(filters);

  return {
    properties: rows.map(mapRow),
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

async function countProperties(filters = {}) {
  const { whereClause, params } = buildWhereClause(filters);
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM properties ${whereClause}`, params);
  return rows[0].total;
}

// All distinct cities currently listed (used for homepage stats / filters)
async function getDistinctCities(filters = {}) {
  const { whereClause, params } = buildWhereClause(filters);
  const [rows] = await pool.query(
    `SELECT DISTINCT location_city FROM properties ${whereClause}`,
    params
  );
  return rows.map(r => r.location_city);
}

async function updateProperty(id, data) {
  if (data.location?.pincode !== undefined && !isValidPincode(data.location.pincode)) {
    throw new Error('Pincode must be exactly 6 digits');
  }
  if (data.contactNumber !== undefined && !isValidContactNumber(data.contactNumber)) {
    throw new Error('Contact number must be exactly 10 digits');
  }

  const fieldMap = {
    title: 'title',
    description: 'description',
    price: 'price',
    priceType: 'price_type',
    type: 'type',
    propertyCategory: 'property_category',
    bedrooms: 'bedrooms',
    bathrooms: 'bathrooms',
    area: 'area',
    contactNumber: 'contact_number',
    whatsappNumber: 'whatsapp_number',
    ownerEmail: 'owner_email',
    status: 'status',
    isUserSubmitted: 'is_user_submitted',
    featured: 'featured'
  };

  const sets = [];
  const params = [];

  for (const [jsKey, column] of Object.entries(fieldMap)) {
    if (data[jsKey] !== undefined) {
      sets.push(`${column} = ?`);
      params.push(data[jsKey]);
    }
  }

  if (data.location) {
    if (data.location.area !== undefined) { sets.push('location_area = ?'); params.push(data.location.area); }
    if (data.location.city !== undefined) { sets.push('location_city = ?'); params.push(data.location.city); }
    if (data.location.state !== undefined) { sets.push('location_state = ?'); params.push(data.location.state); }
    if (data.location.pincode !== undefined) { sets.push('location_pincode = ?'); params.push(data.location.pincode); }
  }

  if (data.submittedBy) {
    if (data.submittedBy.name !== undefined) { sets.push('submitted_by_name = ?'); params.push(data.submittedBy.name); }
    if (data.submittedBy.phone !== undefined) { sets.push('submitted_by_phone = ?'); params.push(data.submittedBy.phone); }
  }

  if (data.photos !== undefined) {
    sets.push('photos = ?');
    params.push(JSON.stringify(data.photos));
  }
  if (data.amenities !== undefined) {
    sets.push('amenities = ?');
    params.push(JSON.stringify(data.amenities));
  }

  if (sets.length === 0) return getPropertyById(id);

  params.push(id);
  await pool.query(`UPDATE properties SET ${sets.join(', ')} WHERE id = ?`, params);

  return getPropertyById(id);
}

// Used by upload-photos endpoint: append new Cloudinary URLs to existing photos array
async function addPhotos(id, newPhotoUrls) {
  const property = await getPropertyById(id);
  if (!property) throw new Error('Property not found');

  const updatedPhotos = [...property.photos, ...newPhotoUrls];
  await pool.query('UPDATE properties SET photos = ? WHERE id = ?', [
    JSON.stringify(updatedPhotos),
    id
  ]);

  return getPropertyById(id);
}

async function deleteProperty(id) {
  const property = await getPropertyById(id);
  if (!property) return null;
  await pool.query('DELETE FROM properties WHERE id = ?', [id]);
  return property;
}

module.exports = {
  createProperty,
  getPropertyById,
  getProperties,
  countProperties,
  getDistinctCities,
  updateProperty,
  addPhotos,
  deleteProperty
};