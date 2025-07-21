// backend/routes/staffRoute.js
const express     = require('express');
const staff       = require('../controllers/staff');
const router      = express.Router();
const jwt         = require('../helpers/jwt');
const adminOnly   = require('../helpers/adminOnly');

// GET all staff & POST (create) staff → admin only
router
  .route('/')
  .get(jwt.userVerify(['staff']), staff.getAllStaff)
  .post(jwt.userVerify(['staff']), staff.createStaff);

// GET/PUT/DELETE staff by ID → admin only
router
  .route('/:id')
  .get(jwt.userVerify(['staff']), staff.getStaff)
  .put(jwt.userVerify(['staff']),  staff.updateStaff)
  .delete(jwt.userVerify(['staff']), staff.deleteStaff);

// STAFF LOGIN (public)
router.route('/login').post(staff.staffLogin);

module.exports = router;
