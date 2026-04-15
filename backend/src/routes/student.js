const express = require('express');
const auth = require('../middleware/auth');
const { studentOnly } = require('../middleware/roles');
const { getUserConnection } = require('../config/db');
const buildAssignment = require('../models/user/Assignment');
const buildAttendance = require('../models/user/Attendance');
const buildTodo = require('../models/user/Todo');
const buildTimetable = require('../models/user/Timetable');
const buildNotice = require('../models/user/Notice');
const buildProfile = require('../models/user/Profile');

const router = express.Router();
router.use(auth, studentOnly);

async function getModels(userid) {
  const conn = await getUserConnection(process.env.MONGODB_URI, userid);
  return {
    Assignment: buildAssignment(conn),
    Attendance: buildAttendance(conn),
    Todo: buildTodo(conn),
    Timetable: buildTimetable(conn),
    Notice: buildNotice(conn),
    Profile: buildProfile(conn)
  };
}

router.get('/me/todo', async (req, res) => {
  const { Todo } = await getModels(req.user.userid);
  res.json(await Todo.find({}).lean());
});

router.post('/me/todo', async (req, res) => {
  const { Todo } = await getModels(req.user.userid);
  const doc = await Todo.create(req.body || {});
  res.json(doc);
});

router.patch('/me/todo/:id', async (req, res) => {
  const { Todo } = await getModels(req.user.userid);
  const doc = await Todo.findByIdAndUpdate(req.params.id, req.body || {}, { new: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

router.delete('/me/todo/:id', async (req, res) => {
  const { Todo } = await getModels(req.user.userid);
  const r = await Todo.findByIdAndDelete(req.params.id);
  if (!r) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

router.get('/me/assignments', async (req, res) => {
  const { Assignment } = await getModels(req.user.userid);
  res.json(await Assignment.find({}).lean());
});

router.get('/me/notices', async (req, res) => {
  const { connectMain } = require('../config/db');
  const buildNotice = require('../models/main/Notice');
  const main = await connectMain(process.env.MONGODB_URI);
  const Notice = buildNotice(main);
  res.json(await Notice.find({}).sort({ createdAt: -1 }).lean());
});

router.get('/me/lostfound', async (req, res) => {
  const { connectMain } = require('../config/db');
  const buildLostFoundModel = require('../models/main/LostFound');
  const main = await connectMain(process.env.MONGODB_URI);
  const LostFound = buildLostFoundModel(main);
  res.json(await LostFound.find({}).sort({ createdAt: -1 }).lean());
});

router.get('/me/attendance', async (req, res) => {
  const { Attendance } = await getModels(req.user.userid);
  res.json(await Attendance.find({}).lean());
});


router.get('/me/timetable', async (req, res) => {
  const { Timetable } = await getModels(req.user.userid);
  res.json(await Timetable.find({}).lean());
});

// Replace timetable with provided array of entries per day
router.post('/me/timetable', async (req, res) => {
  const { Timetable } = await getModels(req.user.userid);
  const items = Array.isArray(req.body) ? req.body : [];
  await Timetable.deleteMany({});
  if (items.length) {
    await Timetable.insertMany(items.map(x => ({ day: x.day, entries: x.entries || [] })));
  }
  res.json({ message: 'Timetable saved' });
});

// Profile: view and update (student can edit their own profile)
router.get('/me/profile', async (req, res) => {
  const { Profile } = await getModels(req.user.userid);
  const doc = await Profile.findOne({}) || await Profile.create({ name: '', email: '' });
  // Extend with optional fields
  res.json({
    fullName: doc.fullName || doc.name || '',
    mobile: doc.mobile || '',
    address: doc.address || '',
    email: doc.email || ''
  });
});

router.post('/me/profile', async (req, res) => {
  const { Profile } = await getModels(req.user.userid);
  const doc = await Profile.findOne({}) || await Profile.create({});
  const { fullName, mobile, address } = req.body || {};
  if (typeof fullName !== 'undefined') doc.fullName = fullName; // keep both for compat
  if (typeof fullName !== 'undefined') doc.name = fullName;
  if (typeof mobile !== 'undefined') doc.mobile = mobile;
  if (typeof address !== 'undefined') doc.address = address;
  await doc.save();
  res.json({ message: 'Profile updated' });
});

module.exports = router;
