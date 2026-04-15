const { Schema } = require('mongoose');

module.exports = (conn) => {
  const schema = new Schema({
    itemName: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Lost', 'Found'], required: true },
    contactNumber: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    date: { type: Date, default: Date.now }
  }, { timestamps: true, collection: 'lost_found' });

  return conn.models.LostFound || conn.model('LostFound', schema);
};
