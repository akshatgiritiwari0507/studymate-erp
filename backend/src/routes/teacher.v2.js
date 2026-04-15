const express = require('express');
const auth = require('../middleware/auth');
const { teacherOnly } = require('../middleware/roles');
const { connectMain } = require('../config/db');
const buildCourse = require('../models/main/Course');
const buildSection = require('../models/main/Section');
const buildEnrollment = require('../models/main/Enrollment');
const buildAssignment = require('../models/main/Assignment');
const buildSubmission = require('../models/main/Submission');
const buildAttendanceSession = require('../models/main/AttendanceSession');
const buildAuditLog = require('../models/main/AuditLog');
const buildUserModel = require('../models/main/User');

const router = express.Router();
router.use(auth, teacherOnly);

async function models() {
  const main = await connectMain(process.env.MONGODB_URI);
  return {
    Course: buildCourse(main),
    Section: buildSection(main),
    Enrollment: buildEnrollment(main),
    Assignment: buildAssignment(main),
    Submission: buildSubmission(main),
    AttendanceSession: buildAttendanceSession(main),
    AuditLog: buildAuditLog(main),
    User: buildUserModel(main),
  };
}

// Courses
router.post('/courses', async (req, res) => {
  const { Course } = await models();
  const { name, code, department, year } = req.body || {};
  if (!name || !code) return res.status(400).json({ message: 'name, code required' });
  
  try {
    const doc = await Course.create({ name, code, department, year, ownerTeacherUserId: req.user.userid });
    res.status(201).json(doc);
  } catch (e) {
    console.error('POST /teacher/v2/courses failed', e);
    res.status(500).json({ message: 'Failed to create course' });
  }
});

// Update an assignment (title/details/dueAt) if owned by teacher
router.put('/assignments/:assignmentId', async (req, res) => {
  try {
    const { Assignment } = await models();
    const { title, details, dueAt } = req.body || {};
    const asg = await Assignment.findOneAndUpdate(
      { _id: req.params.assignmentId, teacherUserId: req.user.userid },
      { $set: { ...(title!==undefined?{title}:{}) , ...(details!==undefined?{details}:{}) , ...(dueAt!==undefined?{dueAt}:{}) } },
      { new: true }
    );
    if (!asg) return res.status(404).json({ message: 'Assignment not found' });
    return res.json(asg);
  } catch (e) {
    console.error('PUT /teacher/v2/assignments/:assignmentId failed', e);
    return res.status(500).json({ message: 'Failed to update assignment' });
  }
});

// Delete an assignment if owned by teacher
router.delete('/assignments/:assignmentId', async (req, res) => {
  try {
    const { Assignment, Submission } = await models();
    const asg = await Assignment.findOne({ _id: req.params.assignmentId, teacherUserId: req.user.userid }).lean();
    if (!asg) return res.status(404).json({ message: 'Assignment not found' });
    await Submission.deleteMany({ assignmentId: asg._id });
    await Assignment.deleteOne({ _id: asg._id });
    return res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('DELETE /teacher/v2/assignments/:assignmentId failed', e);
    return res.status(500).json({ message: 'Failed to delete assignment' });
  }
});
router.get('/courses', async (req, res) => {
  const { Course } = await models();
  const rows = await Course.find({ ownerTeacherUserId: req.user.userid }).lean();
  res.json(rows);
});

// Sections
// Creating sections is admin-only (forbidden here)
router.post('/sections', async (req, res) => {
  return res.status(403).json({ message: 'Forbidden: admin only' });
});
router.get('/sections', async (req, res) => {
  const { Section, Enrollment } = await models();
  // assigned if listed in teachers[] or legacy teacherUserId matches
  const sections = await Section.find({ $or: [ { teachers: req.user.userid }, { teacherUserId: req.user.userid } ] }).lean();
  // attach counts
  const ids = sections.map(s => s._id);
  const counts = await Enrollment.aggregate([
    { $match: { sectionId: { $in: ids } } },
    { $group: { _id: '$sectionId', count: { $sum: 1 } } }
  ]);
  const countMap = new Map(counts.map(c => [String(c._id), c.count]));
  res.json(sections.map(s => ({ ...s, enrollmentCount: countMap.get(String(s._id)) || 0 })));
});
router.get('/sections/:id', async (req, res) => {
  const { Section } = await models();
  const doc = await Section.findOne({ _id: req.params.id, $or: [ { teachers: req.user.userid }, { teacherUserId: req.user.userid } ] }).lean();
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
});
// Deleting sections is admin-only (forbidden here)
router.delete('/sections/:id', async (req, res) => {
  return res.status(403).json({ message: 'Forbidden: admin only' });
});

// Enrollments
router.get('/sections/:id/enrollments', async (req, res) => {
  const { Section, Enrollment, User } = await models();
  const sec = await Section.findOne({ _id: req.params.id, $or: [ { teachers: req.user.userid }, { teacherUserId: req.user.userid } ] }).lean();
  if (!sec) return res.status(404).json({ message: 'Section not found' });
  const rows = await Enrollment.find({ sectionId: req.params.id }).lean();
  const uids = rows.map(r => r.studentUserId);
  const users = uids.length ? await User.find({ userid: { $in: uids } }, { userid: 1, name: 1, fullName: 1 }).lean() : [];
  const nameMap = new Map(users.map(u => [u.userid, u.fullName || u.name || u.userid]));
  res.json(rows.map(r => ({ ...r, name: nameMap.get(r.studentUserId) || r.studentUserId })));
});
router.post('/sections/:id/enrollments', async (req, res) => {
  const { Section, Enrollment } = await models();
  const sec = await Section.findOne({ _id: req.params.id, $or: [ { teachers: req.user.userid }, { teacherUserId: req.user.userid } ] });
  if (!sec) return res.status(404).json({ message: 'Section not found' });
  const { studentUserIds = [] } = req.body || {};
  const unique = Array.from(new Set(studentUserIds.filter(Boolean)));
  const ops = unique.map(uid => ({ updateOne: { filter: { sectionId: sec._id, studentUserId: uid }, update: { $setOnInsert: { sectionId: sec._id, studentUserId: uid, joinedAt: new Date() } }, upsert: true } }));
  if (ops.length) await Enrollment.bulkWrite(ops);
  res.json({ message: 'Enrollments updated', count: unique.length });
});
router.delete('/sections/:id/enrollments/:studentUserId', async (req, res) => {
  const { Section, Enrollment } = await models();
  const sec = await Section.findOne({ _id: req.params.id, $or: [ { teachers: req.user.userid }, { teacherUserId: req.user.userid } ] }).lean();
  if (!sec) return res.status(404).json({ message: 'Section not found' });
  await Enrollment.deleteOne({ sectionId: req.params.id, studentUserId: req.params.studentUserId });
  res.json({ message: 'Enrollment removed' });
});

// Assignments
router.post('/sections/:id/assignments', async (req, res) => {
  try {
    const { Section, Assignment } = await models();
    const sec = await Section.findOne({ _id: req.params.id, $or: [ { teachers: req.user.userid }, { teacherUserId: req.user.userid } ] }).lean();
    if (!sec) return res.status(404).json({ message: 'Section not found' });
    const { title, details, dueAt } = req.body || {};
    if (!title) return res.status(400).json({ message: 'title required' });
    const doc = await Assignment.create({ sectionId: sec._id, teacherUserId: req.user.userid, title, details, dueAt });
    return res.status(201).json(doc);
  } catch (e) {
    console.error('POST /teacher/v2/sections/:id/assignments failed', e);
    return res.status(500).json({ message: 'Failed to create assignment' });
  }
});
router.get('/sections/:id/assignments', async (req, res) => {
  const { Section, Assignment } = await models();
  const sec = await Section.findOne({ _id: req.params.id, $or: [ { teachers: req.user.userid }, { teacherUserId: req.user.userid } ] }).lean();
  if (!sec) return res.status(404).json({ message: 'Section not found' });
  const rows = await Assignment.find({ sectionId: sec._id }).sort({ dueAt: 1 }).lean();
  res.json(rows);
});
router.get('/assignments/:assignmentId/submissions', async (req, res) => {
  const { Assignment, Submission } = await models();
  const asg = await Assignment.findOne({ _id: req.params.assignmentId, teacherUserId: req.user.userid }).lean();
  if (!asg) return res.status(404).json({ message: 'Assignment not found' });
  const rows = await Submission.find({ assignmentId: asg._id }).lean();
  res.json(rows);
});
router.post('/assignments/:assignmentId/grade', async (req, res) => {
  const { Assignment, Submission } = await models();
  const asg = await Assignment.findOne({ _id: req.params.assignmentId, teacherUserId: req.user.userid }).lean();
  if (!asg) return res.status(404).json({ message: 'Assignment not found' });
  const { studentUserId, grade } = req.body || {};
  if (!studentUserId) return res.status(400).json({ message: 'studentUserId required' });
  const doc = await Submission.findOneAndUpdate({ assignmentId: asg._id, studentUserId }, { $set: { grade, status: 'graded' } }, { new: true, upsert: true });
  res.json(doc);
});

// Attendance
router.post('/sections/:id/attendance', async (req, res) => {
  const { Section, AttendanceSession, AuditLog } = await models();
  const sec = await Section.findOne({ _id: req.params.id, $or: [ { teachers: req.user.userid }, { teacherUserId: req.user.userid } ] }).lean();
  if (!sec) return res.status(404).json({ message: 'Section not found' });
  const { date, presentUserIds = [] } = req.body || {};
  if (!date) return res.status(400).json({ message: 'date (YYYY-MM-DD) required' });
  const key = { sectionId: sec._id, date, takenBy: req.user.userid };
  const before = await AttendanceSession.findOne(key).lean();
  const doc = await AttendanceSession.findOneAndUpdate(key, { $set: { presentUserIds, takenBy: req.user.userid } }, { new: true, upsert: true });
  try {
    await AuditLog.create({
      actorUserId: req.user.userid,
      action: 'attendance.upsert',
      targetId: String(sec._id),
      meta: { date, takenBy: req.user.userid },
      before: before ? { presentUserIds: before.presentUserIds } : null,
      after: { presentUserIds },
      ip: req.ip
    });
  } catch {}
  res.json(doc);
});
router.get('/sections/:id/attendance', async (req, res) => {
  const { Section, AttendanceSession } = await models();
  const sec = await Section.findOne({ _id: req.params.id, $or: [ { teachers: req.user.userid }, { teacherUserId: req.user.userid } ] }).lean();
  if (!sec) return res.status(404).json({ message: 'Section not found' });
  const { from, to } = req.query || {};
  const q = { sectionId: sec._id };
  if (from || to) {
    q.date = {};
    if (from) q.date.$gte = from;
    if (to) q.date.$lte = to;
  }
  const rows = await AttendanceSession.find(q).sort({ date: 1 }).lean();
  res.json(rows);
});

module.exports = router;
