const { Schema } = require('mongoose');
module.exports = (conn) => {
  const schema = new Schema({
    title: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
  });
  return conn.models.Notice || conn.model('Notice', schema, 'notices');
};
