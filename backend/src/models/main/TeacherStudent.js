const { Schema } = require('mongoose');

module.exports = (conn) => {
  const TeacherStudentSchema = new Schema({
    teacherUserId: { type: String, required: true, index: true },
    studentUserId: { type: String, required: true, index: true },
  }, { timestamps: true });
  TeacherStudentSchema.index({ teacherUserId: 1, studentUserId: 1 }, { unique: true });
  return conn.models.TeacherStudent || conn.model('TeacherStudent', TeacherStudentSchema);
};
