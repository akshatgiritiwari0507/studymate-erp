const { Schema, Types } = require('mongoose');

module.exports = (conn) => {
  const SectionSchema = new Schema({
    courseId: { type: Types.ObjectId, ref: 'Course', required: true, index: 1 },
    name: { type: String, required: true },
    // legacy single teacher, kept for backward compatibility
    teacherUserId: { type: String, index: 1 },
    // new multi-teacher assignment
    teachers: { type: [String], default: [], index: true },
    term: { type: String },
    schedule: { type: Object }
  }, { timestamps: true, collection: 'sections' });
  // uniqueness per course + name
  SectionSchema.index({ courseId: 1, name: 1 }, { unique: true });
  return conn.models.Section || conn.model('Section', SectionSchema);
};
