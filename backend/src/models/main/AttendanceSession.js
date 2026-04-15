const { Schema, Types } = require('mongoose');

module.exports = (conn) => {
  const AttendanceSessionSchema = new Schema({
    sectionId: { type: Types.ObjectId, ref: 'Section', required: true, index: 1 },
    date: { type: String, required: true, index: 1 }, // store as YYYY-MM-DD string
    takenBy: { type: String, required: true, index: 1 }, // teacher userid
    presentUserIds: { type: [String], default: [] }
  }, { timestamps: true, collection: 'attendance_sessions' });
  AttendanceSessionSchema.index({ sectionId: 1, date: 1, takenBy: 1 }, { unique: true });
  return conn.models.AttendanceSession || conn.model('AttendanceSession', AttendanceSessionSchema);
};
