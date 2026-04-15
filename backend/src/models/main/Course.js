const { Schema } = require('mongoose');

module.exports = (conn) => {
  const CourseSchema = new Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, index: 1 },
    ownerTeacherUserId: { type: String },
    department: { type: String },
    year: { type: String }
  }, { timestamps: true, collection: 'courses' });

  return conn.models.Course || conn.model('Course', CourseSchema);
};
