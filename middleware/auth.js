const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Check cookie first, then session
  const token = req.cookies?.adminToken || req.session?.adminToken;

  if (!token) {
    return res.redirect('/admin/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.clearCookie('adminToken');
    if (req.session) req.session.adminToken = null;
    return res.redirect('/admin/login');
  }
};

module.exports = authMiddleware;
