const { Schema, Types } = require('mongoose');

module.exports = (conn) => {
  const SubmissionSchema = new Schema({
    assignmentId: { type: Types.ObjectId, ref: 'Assignment', required: true, index: 1 },
    studentUserId: { type: String, required: true, index: 1 },
    status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
    grade: { type: String },
    submittedAt: { type: Date, default: Date.now },
    files: { type: Array, default: [] }
  }, { timestamps: true, collection: 'submissions' });
  SubmissionSchema.index({ assignmentId: 1, studentUserId: 1 }, { unique: true });
  return conn.models.Submission || conn.model('Submission', SubmissionSchema);
};
