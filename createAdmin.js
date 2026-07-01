// createAdmin.js — Run once: node createAdmin.js
// Creates a new admin account in the MySQL database.

require('dotenv').config();
const Admin = require('./models/Admin');

async function run() {
  const email = 'inquiry@webjinny.xyz';      // <-- change this if you want
  const password = 'admin123';              // <-- change this to your own password
  // username is auto-generated (e.g. "482913admin") unless you set one here:
  const username = undefined;

  try {
    const admin = await Admin.createAdmin({ username, password, email });
    console.log('✅ Admin created successfully!');
    console.log('   Username:', admin.username);
    console.log('   Email:', admin.email);
    console.log('   Password:', password, '(plain text — only shown here once)');
  } catch (err) {
    console.error('❌ Failed to create admin:', err.message);
  } finally {
    process.exit(0);
  }
}

run();