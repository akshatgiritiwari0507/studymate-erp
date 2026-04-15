const { Schema } = require('mongoose');

module.exports = (conn) => {
  const TeacherSectionSchema = new Schema({
    teacherUserId: { type: String, required: true, index: 1 },
    name: { type: String, required: true },
    members: { type: [String], default: [] } // array of student userIds
  }, { timestamps: true, collection: 'teacher_sections' });
  TeacherSectionSchema.index({ teacherUserId: 1, name: 1 }, { unique: true });
  return conn.models.TeacherSection || conn.model('TeacherSection', TeacherSectionSchema);
};
