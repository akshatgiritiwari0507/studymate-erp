const { Schema, Types } = require('mongoose');

module.exports = (conn) => {
  const EnrollmentSchema = new Schema({
    sectionId: { type: Types.ObjectId, ref: 'Section', required: true, index: 1 },
    studentUserId: { type: String, required: true, index: 1 },
    joinedAt: { type: Date, default: Date.now }
  }, { timestamps: true, collection: 'enrollments' });
  EnrollmentSchema.index({ sectionId: 1, studentUserId: 1 }, { unique: true });
  return conn.models.Enrollment || conn.model('Enrollment', EnrollmentSchema);
};
