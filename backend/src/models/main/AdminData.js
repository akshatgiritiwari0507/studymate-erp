const { Schema } = require('mongoose');

module.exports = (conn) => {
  const AdminDataSchema = new Schema({
    campusEvents: [{ title: String, date: String, description: String }],
    holidays: [{ title: String, date: String, description: String }],
    notices: [{ title: String, description: String, createdAt: { type: Date, default: Date.now } }],
    busRoutes: [{ route: String, stops: [String] }]
  }, { timestamps: true, collection: 'admin_data' });

  return conn.models.AdminData || conn.model('AdminData', AdminDataSchema);
};
