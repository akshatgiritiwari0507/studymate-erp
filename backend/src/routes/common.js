const express = require('express');
const { connectMain } = require('../config/db');
const buildAdminDataModel = require('../models/main/AdminData');
const buildLostFoundModel = require('../models/main/LostFound');
const buildEventModel = require('../models/main/Event');

const router = express.Router();

router.get('/campus-info', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const AdminData = buildAdminDataModel(main);
  const doc = await AdminData.findOne() || await AdminData.create({});
  console.log('Common GET /campus-info sending to student:', JSON.stringify({
    campusEvents: doc.campusEvents || [],
    holidays: doc.holidays || []
  }, null, 2));
  res.json(doc);
});

// Public events endpoint for students
router.get('/events', async (req, res) => {
  try {
    const main = await connectMain(process.env.MONGODB_URI);
    const Event = buildEventModel(main);
    const events = await Event.find({ 
      category: 'college'
    }).sort({ date: 1 });
    console.log('Common GET /events sending to student:', JSON.stringify(events, null, 2));
    res.json(events);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Public Lost & Found list
router.get('/lostfound', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const LostFound = buildLostFoundModel(main);
  const rows = await LostFound.find({}).sort({ createdAt: -1 }).lean();
  res.json(rows);
});

module.exports = router;
