const { Schema } = require('mongoose');
module.exports = (conn) => {
  const schema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: Date, required: true },
    time: { type: String, trim: true },
    location: { type: String, trim: true },
    type: { type: String, enum: ['event', 'holiday'], default: 'event' },
    category: { type: String, enum: ['college', 'personal'], required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: String, trim: true }
  }, { timestamps: true });
  return conn.models.Event || conn.model('Event', schema, 'events');
};
