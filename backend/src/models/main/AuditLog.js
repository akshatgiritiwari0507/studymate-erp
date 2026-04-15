const { Schema } = require('mongoose');

module.exports = (conn) => {
  const AuditLogSchema = new Schema({
    actorUserId: { type: String, required: true, index: 1 },
    action: { type: String, required: true, index: 1 },
    targetId: { type: String, index: 1 },
    before: { type: Object },
    after: { type: Object },
    meta: { type: Object },
    ip: { type: String }
  }, { timestamps: true, collection: 'audit_logs' });
  AuditLogSchema.index({ createdAt: 1 });
  return conn.models.AuditLog || conn.model('AuditLog', AuditLogSchema);
};
