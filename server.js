require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const methodOverride = require('method-override');
const csrf = require('csurf');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Database ───────────────────────────────────────────────────
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing!');
if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is missing!');

const { testConnection } = require('./db');
testConnection();

// ─── View Engine ─────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Middleware ───────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'Webjinny_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Routes ───────────────────────────────────────────────────────
app.use('/', require('./routes/public'));
app.use('/admin', require('./routes/admin'));

// ─── 404 Handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found — 404' });
});

// ─── Error Handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('error', { message: 'Invalid form submission. Please try again.' });
  }
  console.error(err.stack);
  res.status(500).render('error', { message: 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n Webjinny running at http://localhost:${PORT}`);
  console.log(`   Admin panel: http://localhost:${PORT}/admin/login\n`);
});