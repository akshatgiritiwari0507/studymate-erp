const { Schema } = require('mongoose');
module.exports = (conn) => {
  const schema = new Schema({
    date: String,
    status: { type: String, enum: ['present', 'absent'] },
    subject: String
  });
  return conn.models.Attendance || conn.model('Attendance', schema, 'attendance');
};
