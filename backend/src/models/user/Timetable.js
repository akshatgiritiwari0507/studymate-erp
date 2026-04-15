const { Schema } = require('mongoose');
module.exports = (conn) => {
  const schema = new Schema({
    day: String,
    entries: [{ time: String, subject: String, room: String }]
  });
  return conn.models.Timetable || conn.model('Timetable', schema, 'timetable');
};
