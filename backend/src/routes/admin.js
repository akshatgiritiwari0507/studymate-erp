const express = require('express');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roles');
const { connectMain } = require('../config/db');
const buildUserModel = require('../models/main/User');
const buildAdminDataModel = require('../models/main/AdminData');
const buildLostFoundModel = require('../models/main/LostFound');

const router = express.Router();

router.use(auth, adminOnly);

router.get('/users', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const User = buildUserModel(main);
  const users = await User.find({}, { passwordHash: 0 }).lean();
  res.json(users);
});

// Set role for a user
router.post('/users/:userid/role', async (req, res) => {
  const { role } = req.body || {};
  const main = await connectMain(process.env.MONGODB_URI);
  const User = buildUserModel(main);
  await User.updateOne({ userid: req.params.userid }, { $set: { role } });
  res.json({ message: 'Role updated' });
});

router.get('/campus-info', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const AdminData = buildAdminDataModel(main);
  const doc = await AdminData.findOne() || await AdminData.create({});
  res.json(doc);
});

router.post('/campus-info', async (req, res) => {
  console.log('Backend POST /campus-info received:', JSON.stringify(req.body, null, 2));
  const main = await connectMain(process.env.MONGODB_URI);
  const AdminData = buildAdminDataModel(main);
  const doc = await AdminData.findOne() || await AdminData.create({});
  console.log('Before save - current doc holidays:', JSON.stringify(doc.holidays || [], null, 2));
  
  // Update only the fields that are provided
  if (req.body.campusEvents) doc.campusEvents = req.body.campusEvents;
  if (req.body.holidays) doc.holidays = req.body.holidays;
  if (req.body.notices) doc.notices = req.body.notices;
  if (req.body.busRoutes) doc.busRoutes = req.body.busRoutes;
  
  console.log('After assign - doc holidays:', JSON.stringify(doc.holidays || [], null, 2));
  await doc.save();
  console.log('After save - doc holidays:', JSON.stringify(doc.holidays || [], null, 2));
  res.json(doc);
});

// Set student section (single section per student)
router.post('/users/:userid/section', async (req, res) => {
  const { section } = req.body || {};
  const main = await connectMain(process.env.MONGODB_URI);
  const User = buildUserModel(main);
  await User.updateOne({ userid: req.params.userid }, { $set: { section: section || null } });
  res.json({ message: 'Section updated' });
});

// Reset password to userid
router.post('/users/:userid/reset-password', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const User = buildUserModel(main);
  const user = await User.findOne({ userid: req.params.userid });
  if (!user) return res.status(404).json({ message: 'User not found' });
  const bcrypt = require('bcryptjs');
  user.passwordHash = await bcrypt.hash(user.userid, 10);
  await user.save();
  res.json({ message: 'Password reset to userid' });
});

// Lost & Found CRUD (admin only)
router.get('/lostfound', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const LostFound = buildLostFoundModel(main);
  const rows = await LostFound.find({}).sort({ createdAt: -1 }).lean();
  res.json(rows);
});

router.post('/lostfound', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const LostFound = buildLostFoundModel(main);
  const doc = await LostFound.create(req.body || {});
  res.json(doc);
});

router.patch('/lostfound/:id', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const LostFound = buildLostFoundModel(main);
  const doc = await LostFound.findByIdAndUpdate(req.params.id, req.body || {}, { new: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

router.delete('/lostfound/:id', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const LostFound = buildLostFoundModel(main);
  const r = await LostFound.findByIdAndDelete(req.params.id);
  if (!r) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
