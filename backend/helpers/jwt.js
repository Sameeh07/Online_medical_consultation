// backend/helpers/jwt.js

const jwt = require('jsonwebtoken');
const { Staff }   = require('../models/Staff');
const { Doctor }  = require('../models/Doctor');
const { Patient } = require('../models/Patient');

const secret = process.env.secret; // your JWT secret

/**
 * userVerify(allowedTypes)
 * - allowedTypes: an array of user types allowed (e.g. ['staff', 'doctor'])
 * 
 * Verifies the JWT, loads the full user document into req.user, 
 * and ensures decoded.type is in allowedTypes.
 */
exports.userVerify = (allowedTypes = []) => {
  return async (req, res, next) => {
    try {
      // 1. Grab token from header (either x-access-token or Bearer)
      let token = req.headers['x-acess-token'];
      if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts[0] === 'Bearer' && parts[1]) token = parts[1];
      }

      if (!token) {
        return res.status(401).json({ status: 'fail', message: 'Missing authentication token' });
      }

      // 2. Verify JWT
      const decoded = jwt.verify(token, secret);
      // decoded: { id: '...', type: 'staff'|'doctor'|'patient', iat, exp }

      // 3. Load full user document based on type
      let user;
      switch (decoded.type) {
        case 'staff':
          user = await Staff.findById(decoded.id).select('-passwordHash');
          break;
        case 'doctor':
          user = await Doctor.findById(decoded.id).select('-passwordHash');
          break;
        case 'patient':
          user = await Patient.findById(decoded.id).select('-passwordHash');
          break;
        default:
          return res.status(403).json({ status: 'fail', message: 'Invalid user type' });
      }

      if (!user) {
        return res.status(401).json({ status: 'fail', message: 'User not found' });
      }

      // 4. Check if user type is allowed for this route
      if (!allowedTypes.includes(decoded.type)) {
        return res.status(403).json({ status: 'fail', message: 'Forbidden: insufficient privileges' });
      }

      // 5. Attach to req and locals for downstream middleware/controllers
      req.user = user;         // full user document
      res.locals = decoded;    // decoded token data

      next();
    } catch (err) {
      return res.status(401).json({ status: 'fail', message: 'Unauthorized: invalid or expired token' });
    }
  };
};

/**
 * userVerifyId(allowedTypes)
 * - If the route is for a specific resource (e.g. /patient/:id),
 *   this middleware ensures that only the owner (id matches) or
 *   users not in allowedTypes can proceed.
 */
exports.userVerifyId = (allowedTypes = []) => {
  return (req, res, next) => {
    // Only enforce matching ID if the user’s type is in allowedTypes
    if (allowedTypes.includes(res.locals.type)) {
      if (res.locals.id !== req.params.id) {
        return res.status(403).json({ status: 'fail', message: "Forbidden: cannot access other user's data" });
      }
    }
    next();
  };
};


// Other way that can be impliment

// exports.patientVerify = (req, res, next) => {
//   const token = req.headers['x-acess-token'];
//   console.log(token);
//   if (!token) {
//     res.status(400).json({message: 'you need token'});
//   } else {
//     jwt.verify(token, secret, (err, decoded) => {
//       if (err) {
//         res.status(400).json({message: 'fail'});
//       } else {
//         if (['patient', 'admin'].includes(decoded.type)) {
//           //req.body = decoded;
//           res.locals = decoded;
//           next();
//         } else {
//           res.status(400).json({message: 'User is not a Patient or Admin'});
//         }
//       }
//     });
//   }
// };


// exports.doctorAdminVerify = (req, res, next) => {
//   const token = req.headers['x-acess-token'];
//   console.log(token);
//   if (!token) {
//     res.status(400).json({message: 'you need token'});
//   } else {
//     jwt.verify(token, secret, (err, decoded) => {
//       if (err) {
//         res.status(400).json({message: 'fail'});
//       } else {
//         if (['doctor', 'admin'].includes(decoded.type)) {
//           //req.body = decoded;
//           res.locals = decoded;
//           next();
//         } else {
//           res.status(400).json({message: 'User is not a Doctor or Admin'});
//         }
//       }
//     });
//   }
// };

// exports.adminVerify = (req, res, next) => {
//   const token = req.headers['x-acess-token'];
//   console.log(token);
//   if (!token) {
//     res.status(400).json({message: 'you need token'});
//   } else {
//     jwt.verify(token, secret, (err, decoded) => {
//       if (err) {
//         res.status(400).json({message: 'fail'});
//       } else {
//         if (decoded.type == 'admin') {
//           //req.body = decoded;
//           res.locals = decoded;
//           next();
//         } else {
//           res.status(400).json({message: 'User is not a Admin'});
//         }
//       }
//     });
//   }
// };

// exports.userIdCheck = (req,res,next) => {
//   if (res.locals.type != "admin") {
//     if(res.locals.id != req.params.id) {
//       res.status(400).json({message: "You don't have autherize"});
//     } else {
//       next();
//     }
//   } else {
//     next();
//   }
// }


// exports.patientWithID = (req, res, next) => {
//   const token = req.headers['x-acess-token'];
//   console.log(token);
//   if (!token) {
//     res.status(400).json({message: 'you need token'});
//   } else {
//     jwt.verify(token, secret, (err, decoded) => {
//       if (err) {
//         res.status(400).json({message: 'fail'});
//       } else {
//         if (decoded.type != 'patient') {
//           res.locals = decoded;
//           next();
//         } else {
//           if (decoded.id == req.params.id) {
//             res.locals = decoded;
//             next();
//           } else {
//             res.status(400).json({message: "You don't have autherize"});
//           }
//         }
//       }
//     });
//   }
// };