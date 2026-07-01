// models/Enquiry.js
const { pool } = require('../db');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id, // compatibility alias
    name: row.name,
    phone: row.phone,
    email: row.email,
    message: row.message,
    propertyId: row.property_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function createEnquiry({ name, phone, email, message, propertyId }) {
  const [result] = await pool.query(
    `INSERT INTO enquiries (name, phone, email, message, property_id)
     VALUES (?, ?, ?, ?, ?)`,
    [name, phone, email || '', message, propertyId || null]
  );
  return getEnquiryById(result.insertId);
}

async function getEnquiryById(id) {
  const [rows] = await pool.query('SELECT * FROM enquiries WHERE id = ?', [id]);
  return mapRow(rows[0]);
}

async function getAllEnquiries({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT e.*, p.title AS property_title
     FROM enquiries e
     LEFT JOIN properties p ON e.property_id = p.id
     ORDER BY e.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  const [countRows] = await pool.query('SELECT COUNT(*) AS total FROM enquiries');

  return {
    enquiries: rows.map(row => ({ ...mapRow(row), propertyTitle: row.property_title })),
    total: countRows[0].total,
    page,
    totalPages: Math.ceil(countRows[0].total / limit)
  };
}

async function getEnquiriesByProperty(propertyId) {
  const [rows] = await pool.query(
    'SELECT * FROM enquiries WHERE property_id = ? ORDER BY created_at DESC',
    [propertyId]
  );
  return rows.map(mapRow);
}

async function deleteEnquiry(id) {
  await pool.query('DELETE FROM enquiries WHERE id = ?', [id]);
  return true;
}

module.exports = {
  createEnquiry,
  getEnquiryById,
  getAllEnquiries,
  getEnquiriesByProperty,
  deleteEnquiry
};