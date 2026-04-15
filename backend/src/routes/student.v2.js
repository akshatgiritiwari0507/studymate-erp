const express = require('express');
const auth = require('../middleware/auth');
const { studentOnly } = require('../middleware/roles');
const { connectMain } = require('../config/db');
const buildSection = require('../models/main/Section');
const buildEnrollment = require('../models/main/Enrollment');
const buildAssignment = require('../models/main/Assignment');
const buildSubmission = require('../models/main/Submission');
const buildAttendanceSession = require('../models/main/AttendanceSession');
const buildUserModel = require('../models/main/User');
const buildBusRoute = require('../models/main/BusRoute');
const buildNotice = require('../models/main/Notice');

const router = express.Router();
router.use(auth, studentOnly);

async function models(){
  const main = await connectMain(process.env.MONGODB_URI);
  return {
    Section: buildSection(main),
    Enrollment: buildEnrollment(main),
    Assignment: buildAssignment(main),
    Submission: buildSubmission(main),
    AttendanceSession: buildAttendanceSession(main),
    User: buildUserModel(main),
    BusRoute: buildBusRoute(main),
    Notice: buildNotice(main)
  };
}

// Sections the student is enrolled in
router.get('/sections', async (req, res) => {
  const { Section, Enrollment } = await models();
  const ens = await Enrollment.find({ studentUserId: req.user.userid }, { sectionId: 1 }).lean();
  const sectionIds = ens.map(e => e.sectionId);
  const sections = sectionIds.length ? await Section.find({ _id: { $in: sectionIds } }).lean() : [];
  res.json(sections);
});

// Distinct teachers across student's enrolled sections
router.get('/teachers', async (req, res) => {
  const { Section, Enrollment, User } = await models();
  const ens = await Enrollment.find({ studentUserId: req.user.userid }, { sectionId: 1 }).lean();
  const sectionIds = ens.map(e => e.sectionId);
  const sections = sectionIds.length ? await Section.find({ _id: { $in: sectionIds } }, { teachers: 1 }).lean() : [];
  const ids = Array.from(new Set(sections.flatMap(s => s.teachers || [])));
  const users = ids.length ? await User.find({ userid: { $in: ids } }, { userid: 1, name: 1, fullName: 1 }).lean() : [];
  const result = users.map(u => ({ userid: u.userid, name: u.fullName || u.name || u.userid }));
  res.json(result);
});

// Get all bus routes
router.get('/bus-routes', async (req, res) => {
  const { BusRoute } = await models();
  try {
    const routes = await BusRoute.find({}).sort({ busNumber: 1 }).lean();
    res.json(routes);
  } catch (error) {
    console.error('Error fetching bus routes for students:', error);
    res.status(500).json({ message: 'Failed to fetch bus routes' });
  }
});

// Assignments for enrolled sections
router.get('/assignments', async (req, res) => {
  const { Enrollment, Assignment } = await models();
  const ens = await Enrollment.find({ studentUserId: req.user.userid }, { sectionId: 1 }).lean();
  const enrolledIds = new Set(ens.map(e => String(e.sectionId)));
  let sectionFilterIds = Array.from(enrolledIds);
  if (req.query?.sectionId) {
    if (!enrolledIds.has(String(req.query.sectionId))) return res.json([]);
    sectionFilterIds = [ String(req.query.sectionId) ];
  }
  const q = { sectionId: { $in: sectionFilterIds } };
  if (req.query && req.query.teacherUserId) {
    q.teacherUserId = req.query.teacherUserId;
  }
  const rows = sectionFilterIds.length ? await Assignment.find(q).sort({ dueAt: 1 }).lean() : [];
  res.json(rows);
});

router.get('/assignments/:id', async (req, res) => {
  const { Enrollment, Assignment } = await models();
  const asg = await Assignment.findOne({ _id: req.params.id }).lean();
  if (!asg) return res.status(404).json({ message: 'Not found' });
  const enrolled = await Enrollment.findOne({ sectionId: asg.sectionId, studentUserId: req.user.userid }).lean();
  if (!enrolled) return res.status(403).json({ message: 'Forbidden' });
  res.json(asg);
});

// Submit or update submission
router.post('/assignments/:id/submission', async (req, res) => {
  const { Enrollment, Assignment, Submission } = await models();
  const asg = await Assignment.findOne({ _id: req.params.id }).lean();
  if (!asg) return res.status(404).json({ message: 'Assignment not found' });
  const enrolled = await Enrollment.findOne({ sectionId: asg.sectionId, studentUserId: req.user.userid }).lean();
  if (!enrolled) return res.status(403).json({ message: 'Forbidden' });
  const { files = [], content } = req.body || {};
  const doc = await Submission.findOneAndUpdate(
    { assignmentId: asg._id, studentUserId: req.user.userid },
    { $set: { status: 'submitted', submittedAt: new Date(), files, content } },
    { new: true, upsert: true }
  );
  res.json(doc);
});

// Attendance sessions across enrolled sections
router.get('/attendance', async (req, res) => {
  const { Enrollment, AttendanceSession, User } = await models();
  const ens = await Enrollment.find({ studentUserId: req.user.userid }, { sectionId: 1 }).lean();
  const enrolledIds = new Set(ens.map(e => String(e.sectionId)));
  let sectionFilterIds = Array.from(enrolledIds);
  if (req.query?.sectionId) {
    if (!enrolledIds.has(String(req.query.sectionId))) return res.json([]);
    sectionFilterIds = [ String(req.query.sectionId) ];
  }
  const { from, to } = req.query || {};
  const q = { sectionId: { $in: sectionFilterIds } };
  if (from || to) {
    q.date = {};
    if (from) q.date.$gte = from;
    if (to) q.date.$lte = to;
  }
  if (req.query && req.query.teacherUserId) {
    q.takenBy = req.query.teacherUserId;
  }
  const rows = sectionFilterIds.length ? await AttendanceSession.find(q).sort({ date: -1 }).lean() : [];
  const teacherIds = Array.from(new Set(rows.map(r => r.takenBy).filter(Boolean)));
  const teachers = teacherIds.length ? await User.find({ userid: { $in: teacherIds } }, { userid: 1, name: 1, fullName: 1 }).lean() : [];
  const tMap = new Map(teachers.map(t => [t.userid, t.fullName || t.name || t.userid]));
  const result = rows.map(r => ({ ...r, present: Array.isArray(r.presentUserIds) && r.presentUserIds.includes(req.user.userid), takenByName: tMap.get(r.takenBy) || r.takenBy }));
  res.json(result);
});

// Get all notices
router.get('/notices', async (req, res) => {
  const { Notice } = await models();
  try {
    // Get all notices sorted by createdAt in descending order (newest first)
    const notices = await Notice.find({})
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .lean();
    
    res.json(notices);
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ message: 'Failed to fetch notices' });
  }
});

module.exports = router;
