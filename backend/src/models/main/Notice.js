const { Schema } = require('mongoose');
module.exports = (conn) => {
  const schema = new Schema({
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, trim: true }
  });
  return conn.models.Notice || conn.model('Notice', schema, 'notices');
};
