const { Schema } = require('mongoose');
module.exports = (conn) => {
  const stopSchema = new Schema({
    stopName: { type: String, required: true, trim: true },
    arrivalTime: { type: String, required: true, trim: true }
  }, { _id: false });

  const schema = new Schema({
    busNumber: { type: String, required: true, trim: true },
    shift: { type: String, enum: ['morning', 'afternoon'], required: true },
    departureTime: { type: String, required: true, trim: true },
    stops: { type: [stopSchema], default: [] }
  }, { timestamps: true });

  return conn.models.BusRoute || conn.model('BusRoute', schema, 'bus_routes');
};
