const { Schema, Types } = require('mongoose');

module.exports = (conn) => {
  const AssignmentSchema = new Schema({
    sectionId: { type: Types.ObjectId, ref: 'Section', required: true, index: 1 },
    teacherUserId: { type: String, required: true, index: 1 },
    title: { type: String, required: true },
    details: { type: String },
    dueAt: { type: Date },
    attachments: { type: Array, default: [] }
  }, { timestamps: true, collection: 'assignments' });
  AssignmentSchema.index({ sectionId: 1, dueAt: 1 });
  return conn.models.Assignment || conn.model('Assignment', AssignmentSchema);
};
