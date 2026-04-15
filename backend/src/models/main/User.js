const { Schema } = require('mongoose');

module.exports = (conn) => {
  const UserSchema = new Schema({
    userid: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'teacher', 'student', null], default: null },
    userDbName: { type: String, required: true },
    section: { type: String, default: null }
  }, { timestamps: true });

  return conn.models.User || conn.model('User', UserSchema);
};
