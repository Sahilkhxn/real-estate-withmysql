// models/Admin.js
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

function generateUsername() {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `${digits}admin`;
}

// Converts DB row (snake_case) -> camelCase object, with _id alias for
// compatibility with views/code that still expect Mongo-style `_id`.
function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id, // compatibility alias
    username: row.username,
    password: row.password,
    email: row.email,
    resetOTP: row.reset_otp,
    resetOTPExpiry: row.reset_otp_expiry,
    createdAt: row.created_at
  };
}

async function createAdmin({ username, password, email }) {
  const finalUsername = username || generateUsername();
  const hashedPassword = await bcrypt.hash(password, 12);

  const [result] = await pool.query(
    `INSERT INTO admins (username, password, email, created_at)
     VALUES (?, ?, ?, NOW())`,
    [finalUsername, hashedPassword, email]
  );

  return findById(result.insertId);
}

async function findByUsername(username) {
  const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
  return mapRow(rows[0]);
}

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
  return mapRow(rows[0]);
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM admins WHERE id = ?', [id]);
  return mapRow(rows[0]);
}

// Replaces adminSchema.methods.comparePassword
async function comparePassword(candidatePassword, hashedPassword) {
  return bcrypt.compare(candidatePassword, hashedPassword);
}

// Update password (re-hashes, like the old pre-save hook did)
async function updatePassword(id, newPassword) {
  const hashed = await bcrypt.hash(newPassword, 12);
  await pool.query('UPDATE admins SET password = ? WHERE id = ?', [hashed, id]);
}

// OTP handling (forgot-password flow)
async function setResetOTP(email, otp, expiry) {
  await pool.query(
    'UPDATE admins SET reset_otp = ?, reset_otp_expiry = ? WHERE email = ?',
    [otp, expiry, email]
  );
}

async function clearResetOTP(id) {
  await pool.query(
    'UPDATE admins SET reset_otp = NULL, reset_otp_expiry = NULL WHERE id = ?',
    [id]
  );
}

module.exports = {
  createAdmin,
  findByUsername,
  findByEmail,
  findById,
  comparePassword,
  updatePassword,
  setResetOTP,
  clearResetOTP,
  generateUsername
};