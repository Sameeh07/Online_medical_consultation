// backend/helpers/adminOnly.js
module.exports = function adminOnly(req, res, next) {
  // req.user is set by jwt.userVerify()
  if (!req.user || req.user.type !== 'staff' || req.user.position !== 'admin') {
    return res.status(403).json({ status: 'fail', message: 'Admins only' });
  }
  next();
};
