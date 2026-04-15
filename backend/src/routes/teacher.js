const express = require('express');
const auth = require('../middleware/auth');
const { teacherOnly } = require('../middleware/roles');
const { connectMain, getUserConnection } = require('../config/db');
const buildUserModel = require('../models/main/User');
const buildTeacherStudentModel = require('../models/main/TeacherStudent');
const buildTeacherSectionModel = require('../models/main/TeacherSection');
const buildAssignment = require('../models/user/Assignment');
const buildAttendance = require('../models/user/Attendance');
const buildNotice = require('../models/user/Notice');
const buildProfile = require('../models/user/Profile');
const buildTodo = require('../models/user/Todo');
const buildTimetable = require('../models/user/Timetable');
const buildLostFoundModel = require('../models/main/LostFound');

const router = express.Router();
router.use(auth, teacherOnly);

// Profile: view/update
router.get('/me/profile', async (req, res) => {
  const conn = await getUserConnection(process.env.MONGODB_URI, req.user.userid);
  const Profile = buildProfile(conn);
  const doc = await Profile.findOne({}) || await Profile.create({ name: '', email: '' });
  res.json({
    fullName: doc.fullName || doc.name || '',
    mobile: doc.mobile || '',
    address: doc.address || '',
    email: doc.email || ''
  });
});

router.post('/me/profile', async (req, res) => {
  const conn = await getUserConnection(process.env.MONGODB_URI, req.user.userid);
  const Profile = buildProfile(conn);
  const doc = await Profile.findOne({}) || await Profile.create({});
  const { fullName, mobile, address } = req.body || {};
  if (typeof fullName !== 'undefined') { doc.fullName = fullName; doc.name = fullName; }
  if (typeof mobile !== 'undefined') doc.mobile = mobile;
  if (typeof address !== 'undefined') doc.address = address;
  await doc.save();
  res.json({ message: 'Profile updated' });
});

// Self To-Do
router.get('/me/todo', async (req, res) => {
  const conn = await getUserConnection(process.env.MONGODB_URI, req.user.userid);
  const Todo = buildTodo(conn);
  res.json(await Todo.find({}).lean());
});

router.post('/me/todo', async (req, res) => {
  const conn = await getUserConnection(process.env.MONGODB_URI, req.user.userid);
  const Todo = buildTodo(conn);
  const doc = await Todo.create(req.body || {});
  res.json(doc);
});

router.patch('/me/todo/:id', async (req, res) => {
  const conn = await getUserConnection(process.env.MONGODB_URI, req.user.userid);
  const Todo = buildTodo(conn);
  const doc = await Todo.findByIdAndUpdate(req.params.id, req.body || {}, { new: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});

router.delete('/me/todo/:id', async (req, res) => {
  const conn = await getUserConnection(process.env.MONGODB_URI, req.user.userid);
  const Todo = buildTodo(conn);
  const r = await Todo.findByIdAndDelete(req.params.id);
  if (!r) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
});

// Self Timetable
router.get('/me/timetable', async (req, res) => {
  const conn = await getUserConnection(process.env.MONGODB_URI, req.user.userid);
  const Timetable = buildTimetable(conn);
  res.json(await Timetable.find({}).lean());
});

router.post('/me/timetable', async (req, res) => {
  const conn = await getUserConnection(process.env.MONGODB_URI, req.user.userid);
  const Timetable = buildTimetable(conn);
  const items = Array.isArray(req.body) ? req.body : [];
  await Timetable.deleteMany({});
  if (items.length) await Timetable.insertMany(items.map(x=>({ day:x.day, entries:x.entries||[] })));
  res.json({ message: 'Timetable saved' });
});

router.delete('/me/timetable', async (req, res) => {
  const conn = await getUserConnection(process.env.MONGODB_URI, req.user.userid);
  const Timetable = buildTimetable(conn);
  await Timetable.deleteMany({});
  res.json({ message: 'Timetable cleared' });
});

// Self Notices (read-only list)
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

router.post('/me/timetable', async (req, res) => {
  const conn = await getUserConnection(process.env.MONGODB_URI, req.user.userid);
  const Timetable = buildTimetable(conn);
  const items = Array.isArray(req.body) ? req.body : [];
  await Timetable.deleteMany({});
  if (items.length) await Timetable.insertMany(items.map(x=>({ day:x.day, entries:x.entries||[] })));
  res.json({ message: 'Timetable saved' });
});

router.post('/students/add', async (req, res) => {
  const { studentUserId } = req.body;
  const main = await connectMain(process.env.MONGODB_URI);
  const TeacherStudent = buildTeacherStudentModel(main);
  await TeacherStudent.create({ teacherUserId: req.user.userid, studentUserId });
  res.json({ message: 'Student added' });
});

router.post('/students/remove', async (req, res) => {
  const { studentUserId } = req.body;
  const main = await connectMain(process.env.MONGODB_URI);
  const TeacherStudent = buildTeacherStudentModel(main);
  await TeacherStudent.deleteOne({ teacherUserId: req.user.userid, studentUserId });
  res.json({ message: 'Student removed' });
});

router.get('/students', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const TeacherStudent = buildTeacherStudentModel(main);
  const rows = await TeacherStudent.find({ teacherUserId: req.user.userid }).lean();
  res.json(rows);
});

// Sections CRUD
router.get('/sections', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const TeacherSection = buildTeacherSectionModel(main);
  const rows = await TeacherSection.find({ teacherUserId: req.user.userid }).lean();
  res.json(rows);
});

router.post('/sections', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const TeacherSection = buildTeacherSectionModel(main);
  const doc = await TeacherSection.create({ teacherUserId: req.user.userid, name: req.body?.name });
  res.json(doc);
});

router.delete('/sections/:id', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const TeacherSection = buildTeacherSectionModel(main);
  await TeacherSection.deleteOne({ _id: req.params.id, teacherUserId: req.user.userid });
  res.json({ message: 'Deleted' });
});

// Section detail with member list (student names)
router.get('/sections/:id', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const TeacherSection = buildTeacherSectionModel(main);
  const User = buildUserModel(main);
  const sec = await TeacherSection.findOne({ _id: req.params.id, teacherUserId: req.user.userid }).lean();
  if (!sec) return res.status(404).json({ message: 'Section not found' });
  const members = Array.isArray(sec.members) ? sec.members : [];
  const users = members.length ? await User.find({ userid: { $in: members } }, { userid: 1, name: 1, fullName: 1 }).lean() : [];
  res.json({ _id: sec._id, name: sec.name, members: users.map(u => ({ userid: u.userid, name: u.fullName || u.name || u.userid })) });
});

// Add member to section
router.post('/sections/:id/members', async (req, res) => {
  const { studentUserId } = req.body || {};
  if (!studentUserId) return res.status(400).json({ message: 'studentUserId required' });
  const main = await connectMain(process.env.MONGODB_URI);
  const TeacherSection = buildTeacherSectionModel(main);
  const User = buildUserModel(main);
  const sec = await TeacherSection.findOne({ _id: req.params.id, teacherUserId: req.user.userid });
  if (!sec) return res.status(404).json({ message: 'Section not found' });
  const stu = await User.findOne({ userid: studentUserId, role: 'student' }).lean();
  if (!stu) return res.status(404).json({ message: 'Student not found' });
  sec.members = Array.isArray(sec.members) ? sec.members : [];
  if (!sec.members.includes(studentUserId)) sec.members.push(studentUserId);
  await sec.save();
  res.json({ message: 'Member added' });
});

// Remove member from section
router.delete('/sections/:id/members/:studentUserId', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const TeacherSection = buildTeacherSectionModel(main);
  const sec = await TeacherSection.findOne({ _id: req.params.id, teacherUserId: req.user.userid });
  if (!sec) return res.status(404).json({ message: 'Section not found' });
  sec.members = (sec.members || []).filter(x => x !== req.params.studentUserId);
  await sec.save();
  res.json({ message: 'Member removed' });
});

// List students by section
// Deprecated: students by admin section name (kept for compatibility)
router.get('/sections/:name/students', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const User = buildUserModel(main);
  const rows = await User.find({ role: 'student', section: req.params.name }, { userid: 1, section: 1 }).lean();
  res.json(rows);
});

// Assignment by section: push to each student with that section
// Assignments by teacher-owned section id
router.post('/sections/:id/assignments', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const TeacherSection = buildTeacherSectionModel(main);
  const sec = await TeacherSection.findOne({ _id: req.params.id, teacherUserId: req.user.userid }).lean();
  if (!sec) return res.status(404).json({ message: 'Section not found' });
  const members = Array.isArray(sec.members) ? sec.members : [];
  const payload = req.body || {};
  let count = 0;
  for (const userId of members) {
    const conn = await getUserConnection(process.env.MONGODB_URI, userId);
    const Assignment = buildAssignment(conn);
    await Assignment.create(payload);
    count++;
  }
  res.json({ message: 'Assignments posted', count });
});

// Attendance by section: mark present by list on date
// Attendance by teacher-owned section id
router.post('/sections/:id/attendance', async (req, res) => {
  const { date, presentUserIds = [] } = req.body || {};
  const main = await connectMain(process.env.MONGODB_URI);
  const TeacherSection = buildTeacherSectionModel(main);
  const sec = await TeacherSection.findOne({ _id: req.params.id, teacherUserId: req.user.userid }).lean();
  if (!sec) return res.status(404).json({ message: 'Section not found' });
  const members = Array.isArray(sec.members) ? sec.members : [];
  let count = 0;
  for (const userId of members) {
    const conn = await getUserConnection(process.env.MONGODB_URI, userId);
    const Attendance = buildAttendance(conn);
    await Attendance.create({ date, present: Array.isArray(presentUserIds) && presentUserIds.includes(userId) });
    count++;
  }
  res.json({ message: 'Attendance recorded', count });
});

router.post('/students/:studentUserId/assignments', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const TeacherStudent = buildTeacherStudentModel(main);
  const map = await TeacherStudent.findOne({ teacherUserId: req.user.userid, studentUserId: req.params.studentUserId });
  if (!map) return res.status(403).json({ message: 'Not mapped to this student' });
  const conn = await getUserConnection(process.env.MONGODB_URI, req.params.studentUserId);
  const Assignment = buildAssignment(conn);
  const doc = await Assignment.create(req.body || {});
  res.json(doc);
});

router.post('/students/:studentUserId/attendance', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const TeacherStudent = buildTeacherStudentModel(main);
  const map = await TeacherStudent.findOne({ teacherUserId: req.user.userid, studentUserId: req.params.studentUserId });
  if (!map) return res.status(403).json({ message: 'Not mapped to this student' });
  const conn = await getUserConnection(process.env.MONGODB_URI, req.params.studentUserId);
  const Attendance = buildAttendance(conn);
  const doc = await Attendance.create(req.body || {});
  res.json(doc);
});

router.post('/students/:studentUserId/notices', async (req, res) => {
  const main = await connectMain(process.env.MONGODB_URI);
  const TeacherStudent = buildTeacherStudentModel(main);
  const map = await TeacherStudent.findOne({ teacherUserId: req.user.userid, studentUserId: req.params.studentUserId });
  if (!map) return res.status(403).json({ message: 'Not mapped to this student' });
  const conn = await getUserConnection(process.env.MONGODB_URI, req.params.studentUserId);
  const Notice = buildNotice(conn);
  const doc = await Notice.create(req.body || {});
  res.json(doc);
});

module.exports = router;
