const { Schema } = require('mongoose');
module.exports = (conn) => {
  const schema = new Schema({
    name: String,
    email: String
  });
  return conn.models.Profile || conn.model('Profile', schema, 'profile');
};
