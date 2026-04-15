const { Schema } = require('mongoose');
module.exports = (conn) => {
  const schema = new Schema({
    title: String,
    subject: String,
    dueDate: String,
    description: String,
    createdAt: { type: Date, default: Date.now }
  });
  return conn.models.Assignment || conn.model('Assignment', schema, 'assignments');
};
