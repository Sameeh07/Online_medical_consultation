/* Specialization data model for mongodb and mongoose */

const mongoose = require('mongoose');

const scSchema = new mongoose.Schema({
  specialization: {
    type: String,
    required: false,
  },
  detail: {
    type: String,
    required: false,
  },
});

scSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

scSchema.set('toJSON', {
  virtuals: true,
});

exports.Specialization = mongoose.model('Specialization', scSchema);
exports.scSchema = scSchema;