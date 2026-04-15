const express = require('express');
const auth = require('../middleware/auth');
const { adminOnly } = require('../middleware/roles');
const { connectMain } = require('../config/db');
const { Types } = require('mongoose');
const buildCourse = require('../models/main/Course');
const buildSection = require('../models/main/Section');
const buildEnrollment = require('../models/main/Enrollment');
const buildAssignment = require('../models/main/Assignment');
const buildAttendanceSession = require('../models/main/AttendanceSession');
const buildUserModel = require('../models/main/User');
const buildAuditLog = require('../models/main/AuditLog');
const buildSubmission = require('../models/main/Submission');
const buildBusRoute = require('../models/main/BusRoute');
const buildEvent = require('../models/main/Event');
const buildLostFound = require('../models/main/LostFound');
const buildNoticeMain = require('../models/main/Notice');

const router = express.Router();
const bcrypt = require('bcryptjs');
const { userDbNameFor } = require('../config/db');
router.use(auth, adminOnly);

async function models(){
  const main = await connectMain(process.env.MONGODB_URI);
  return {
    Course: buildCourse(main),
    Section: buildSection(main),
    Enrollment: buildEnrollment(main),
    Assignment: buildAssignment(main),
    AttendanceSession: buildAttendanceSession(main),
    User: buildUserModel(main),
    AuditLog: buildAuditLog(main),
    Submission: buildSubmission(main),
    BusRoute: buildBusRoute(main),
    Event: buildEvent(main),
    LostFound: buildLostFound(main),
    NoticeMain: buildNoticeMain(main)
  };
}

// Create a teacher account
router.post('/teachers', async (req, res) => {
  try {
    const { User, Section } = await models();
    const { userid, password } = req.body || {};
    if (!userid || !password) return res.status(400).json({ message: 'userid and password required' });
    const existing = await User.findOne({ userid }).lean();
    if (existing) return res.status(409).json({ message: 'User already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const doc = await User.create({ userid, role: 'teacher', passwordHash });
    return res.status(201).json({ userid: doc.userid, role: doc.role });
  
  } catch (e) {
    console.error('POST /admin/v2/teachers failed', e);
    return res.status(500).json({ message: 'Failed to create teacher' });
  }
});

// --- Bus Routes CRUD ---
// Admin-only bus routes endpoint
router.get('/bus-routes', async (req, res) => {
  const { BusRoute } = await models();
  const rows = await BusRoute.find({}).sort({ busNumber: 1 }).lean();
  res.json(rows);
});

router.post('/bus-routes', async (req, res) => {
  try {
    const { BusRoute } = await models();
    const doc = await BusRoute.create(req.body || {});
    res.status(201).json(doc);
  } catch (e) {
    return res.status(400).json({ message: 'Invalid bus route payload' });
  }
});

router.patch('/bus-routes/:id', async (req, res) => {
  const { BusRoute } = await models();
  const doc = await BusRoute.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Route not found' });
  Object.assign(doc, req.body || {});
  await doc.save();
  res.json(doc);
});

router.delete('/bus-routes/:id', async (req, res) => {
  const { BusRoute } = await models();
  const d = await BusRoute.findByIdAndDelete(req.params.id);
  if (!d) return res.status(404).json({ message: 'Route not found' });
  res.json({ message: 'Route deleted' });
});

// --- Events & Holidays ---
// Query: category=college|personal, createdBy=userid (required for personal)
router.get('/events', async (req, res) => {
  try {
    const { Event } = await models();
    const { category, createdBy } = req.query || {};
    let q = {};
    if (category === 'personal') {
      if (!createdBy) return res.status(400).json({ message: 'Missing createdBy for personal events' });
      q = { category: 'personal', createdBy };
    } else {
      q = { $or: [ { category: 'college' }, { category: { $exists: false } } ] };
    }
    const rows = await Event.find(q).sort({ date: 1 }).lean();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Failed to load events' });
  }
});

router.post('/events', async (req, res) => {
  try {
    const { Event } = await models();
    const body = { ...req.body };
    if (!body.category) body.category = 'college';
    const doc = await Event.create(body);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ message: 'Failed to create event' });
  }
});

router.patch('/events/:id', async (req, res) => {
  const { Event } = await models();
  const doc = await Event.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Event not found' });
  Object.assign(doc, req.body || {});
  await doc.save();
  res.json(doc);
});

router.delete('/events/:id', async (req, res) => {
  const { Event } = await models();
  const doc = await Event.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Event not found' });
  await doc.deleteOne();
  res.json({ message: 'Event deleted' });
});

// --- Notices ---
router.get('/notices', async (req, res) => {
  const { NoticeMain } = await models();
  const rows = await NoticeMain.find({}).sort({ createdAt: -1 }).lean();
  res.json(rows);
});

router.post('/notices', async (req, res) => {
  try {
    const { NoticeMain } = await models();
    const { message, createdBy } = req.body || {};
    if (!message) return res.status(400).json({ message: 'message required' });
    const doc = await NoticeMain.create({ message, createdBy });
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ message: e?.message || 'Failed to create notice' });
  }
});

router.delete('/notices/:id', async (req, res) => {
  const { NoticeMain } = await models();
  const d = await NoticeMain.findByIdAndDelete(req.params.id);
  if (!d) return res.status(404).json({ message: 'Notice not found' });
  res.json({ message: 'Notice deleted' });
});

// --- Lost & Found ---
router.get('/lostfound', async (req, res) => {
  const { LostFound } = await models();
  const rows = await LostFound.find({}).sort({ date: -1 }).lean();
  res.json(rows);
});

router.post('/lostfound', async (req, res) => {
  try {
    const { LostFound } = await models();
    const { itemName, location, status, contactNumber, description } = req.body || {};
    const payload = {
      itemName: String(itemName||'').trim(),
      location: String(location||'').trim(),
      status: (status === 'Found' ? 'Found' : 'Lost'),
      contactNumber: String(contactNumber||'').trim(),
      description: description ? String(description) : ''
    };
    if (!payload.itemName || !payload.location || !payload.contactNumber) {
      return res.status(400).json({ message: 'itemName, location, contactNumber are required' });
    }
    const doc = await LostFound.create(payload);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ message: e?.message || 'Failed to add item' });
  }
});

router.patch('/lostfound/:id', async (req, res) => {
  const { LostFound } = await models();
  const doc = await LostFound.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Item not found' });
  Object.assign(doc, req.body || {});
  await doc.save();
  res.json(doc);
});

router.delete('/lostfound/:id', async (req, res) => {
  const { LostFound } = await models();
  const d = await LostFound.findByIdAndDelete(req.params.id);
  if (!d) return res.status(404).json({ message: 'Item not found' });
  res.json({ message: 'Item deleted' });
});

// Delete a teacher account and remove from section teacher lists
router.delete('/teachers/:userid', async (req, res) => {
  try {
    const { User, Section } = await models();
    const u = await User.findOne({ userid: req.params.userid, role: 'teacher' });
    if (!u) return res.status(404).json({ message: 'Teacher not found' });
    await Section.updateMany({ teachers: req.params.userid }, { $pull: { teachers: req.params.userid } });
    await User.deleteOne({ _id: u._id });
    return res.json({ message: 'Teacher deleted' });
  } catch (e) {
    console.error('DELETE /admin/v2/teachers/:userid failed', e);
    return res.status(500).json({ message: 'Failed to delete teacher' });
  }
});

// Search users by userid or name
router.get('/users/search', async (req, res) => {
  try {
    const { User } = await models();
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const rows = await User.find({ $or: [ { userid: re }, { name: re }, { fullName: re } ] }, { passwordHash: 0 }).limit(50).lean();
    return res.json(rows);
  } catch (e) {
    console.error('GET /admin/v2/users/search failed', e);
    return res.status(500).json({ message: 'Failed to search users' });
  }
});

// List sections with optional courseId filter
router.get('/sections', async (req, res) => {
  try {
    const { Section, Course } = await models();
    const q = {};
    if (req.query.courseId) q.courseId = req.query.courseId;
    const sections = await Section.find(q).lean();
    // include course code/name for convenience
    const courseIds = Array.from(new Set(sections.map(s => String(s.courseId))));
    const courses = courseIds.length ? await Course.find({ _id: { $in: courseIds } }).lean() : [];
    const cmap = new Map(courses.map(c => [String(c._id), c]));
    const rows = sections.map(s => ({ ...s, course: cmap.get(String(s.courseId)) || null }));
    return res.json(rows);
  } catch (e) {
    console.error('GET /admin/v2/sections failed', e);
    return res.status(500).json({ message: 'Failed to list sections' });
  }
});

// Set student enrollment to a specific course/section
router.post('/students/enrollment', async (req, res) => {
  try {
    const { Enrollment, Section } = await models();
    const { studentUserId, courseId, sectionId } = req.body || {};
    if (!studentUserId || !courseId || !sectionId) return res.status(400).json({ message: 'studentUserId, courseId, sectionId required' });
    const sec = await Section.findOne({ _id: sectionId }).lean();
    if (!sec) return res.status(404).json({ message: 'Section not found' });
    if (String(sec.courseId) !== String(courseId)) return res.status(400).json({ message: 'Section does not belong to course' });
    await Enrollment.deleteMany({ studentUserId });
    await Enrollment.create({ studentUserId, sectionId });
    return res.json({ message: 'Enrollment updated' });
  } catch (e) {
    console.error('POST /admin/v2/students/enrollment failed', e);
    return res.status(500).json({ message: 'Failed to set enrollment' });
  }
});

// --- Courses CRUD ---
router.get('/courses', async (req, res) => {
  const { Course } = await models();
  res.json(await Course.find({}).lean());
});

// --- Maintenance: Purge a course completely (danger) ---
// Deletes all sections (including 'notassigned') and related data, then deletes the course
router.post('/maintenance/course/:id/purge', async (req, res) => {
  const { Course, Section, Enrollment, Assignment, AttendanceSession, AuditLog } = await models();
  try {
    const courseId = req.params.id;
    const sections = await Section.find({ courseId: courseId }).lean();
    const sectionIds = sections.map(s => String(s._id));
    const result = {};
    if (sectionIds.length) {
      result.enrollments = await Enrollment.deleteMany({ sectionId: { $in: sectionIds } });
      result.assignments = await Assignment.deleteMany({ sectionId: { $in: sectionIds } });
      result.attendance = await AttendanceSession.deleteMany({ sectionId: { $in: sectionIds } });
      result.sections = await Section.deleteMany({ _id: { $in: sectionIds } });
    }
    result.course = await Course.deleteOne({ _id: courseId });
    try { await AuditLog.create({ actorUserId: req.user.userid, action: 'maintenance.coursePurge', targetId: String(courseId), after: { sectionCount: sections.length }, ip: req.ip }); } catch {}
    res.json({ message: 'Course purged', result });
  } catch (e) {
    console.error('course purge failed', e);
    res.status(500).json({ message: 'Course purge failed' });
  }
});

// --- Maintenance: Fix Section indexes (ensure compound unique {courseId:1,name:1}) ---
router.post('/maintenance/sections-fix-index', async (req, res) => {
  const { Section, AuditLog } = await models();
  try {
    const col = Section.collection;
    const idxs = await col.indexes();
    const dropped = [];
    // Drop any unique index solely on name
    const bad = idxs.find(i => Array.isArray(i.key) ? false : (i.key && i.key.name === 1 && i.unique));
    if (bad && bad.name) {
      try { await col.dropIndex(bad.name); dropped.push(bad.name); } catch {}
    }
    // Ensure correct compound unique index
    await col.createIndex({ courseId: 1, name: 1 }, { unique: true, name: 'courseId_1_name_1' });
    try { await AuditLog.create({ actorUserId: req.user.userid, action: 'maintenance.sectionsFixIndex', targetId: 'sections', after: { dropped }, ip: req.ip }); } catch {}
    res.json({ message: 'Indexes fixed', dropped });
  } catch (e) {
    console.error('sections-fix-index failed', e);
    res.status(500).json({ message: 'Fix index failed' });
  }
});

// --- Maintenance: Diagnose sections by name (to see duplicates across courses) ---
router.get('/maintenance/sections-diagnose', async (req, res) => {
  const { Section, Course } = await models();
  const { name } = req.query || {};
  try {
    const q = name ? { name: new RegExp('^'+String(name).trim()+'$', 'i') } : {};
    const rows = await Section.find(q).lean();
    const courseIds = Array.from(new Set(rows.map(r => String(r.courseId)).filter(Boolean)));
    const courses = courseIds.length ? await Course.find({ _id: { $in: courseIds } }, { name: 1, code: 1 }).lean() : [];
    const cmap = new Map(courses.map(c => [String(c._id), c]));
    res.json(rows.map(r => ({ id: String(r._id), name: r.name, courseId: String(r.courseId||''), course: cmap.get(String(r.courseId))||null })));
  } catch (e) {
    console.error('sections-diagnose failed', e);
    res.status(500).json({ message: 'Diagnose failed' });
  }
});

// --- Maintenance: Ensure sections per course (notassigned + A-F) ---
router.post('/maintenance/ensure-sections', async (req, res) => {
  const { Course, Section, AuditLog } = await models();
  try {
    const courses = await Course.find({}).lean();
    const need = ['notassigned','A','B','C','D','E','F'];
    const perCourse = [];
    for (const c of courses) {
      const haveDocs = await Section.find({ courseId: String(c._id) }, { name: 1 }).lean();
      const have = new Set(haveDocs.map(x => x.name));
      const created = [];
      for (const name of need) {
        if (!have.has(name)) {
          await Section.create({ courseId: String(c._id), name, teachers: [] });
          created.push(name);
        }
      }
      perCourse.push({ course: { id: String(c._id), name: c.name, code: c.code }, created, existing: Array.from(have) });
    }
    try { await AuditLog.create({ actorUserId: req.user.userid, action: 'maintenance.ensureSections', targetId: 'ALL', after: { courses: courses.length }, ip: req.ip }); } catch {}
    const totalSections = await Section.countDocuments({});
    res.json({ message: 'Ensured sections', totalCourses: courses.length, totalSections, perCourse });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ensure sections failed' });
  }
});

// --- Maintenance: Seed basic demo data ---
// Creates courses (btech,mtech,bca,mca,bba,mba), sections A-F per course, 100 students into btech A-F (20 each), and 20 teachers.
router.post('/maintenance/seed-basic', async (req, res) => {
  const { Course, Section, Enrollment, User, AuditLog } = await models();
  try {
    const courseDefs = [
      { name: 'btech', code: 'BTECH' },
      { name: 'mtech', code: 'MTECH' },
      { name: 'bca', code: 'BCA' },
      { name: 'mca', code: 'MCA' },
      { name: 'bba', code: 'BBA' },
      { name: 'mba', code: 'MBA' }
    ];
    const sectionNames = ['A','B','C','D','E','F'];

    // Upsert courses
    const courseMap = new Map();
    const sectionCreatedPerCourse = {};
    for (const c of courseDefs) {
      let doc = await Course.findOne({ code: c.code });
      if (!doc) doc = await Course.create(c);
      courseMap.set(c.name, doc._id);
      sectionCreatedPerCourse[c.name] = sectionCreatedPerCourse[c.name] || { created: 0 };
      // ensure notassigned section
      const ex = await Section.findOne({ courseId: String(doc._id), name: 'notassigned' });
      if (!ex) { await Section.create({ courseId: String(doc._id), name: 'notassigned', teachers: [] }); sectionCreatedPerCourse[c.name].created++; }
      // ensure A-F
      for (const sn of sectionNames) {
        const sx = await Section.findOne({ courseId: String(doc._id), name: sn });
        if (!sx) { await Section.create({ courseId: String(doc._id), name: sn, teachers: [] }); sectionCreatedPerCourse[c.name].created++; }
      }
    }

    // Create 100 students 22bcon001..100 with same password and enroll into btech A-F (20 each)
    const btechId = courseMap.get('btech');
    const btechSections = await Section.find({ courseId: String(btechId), name: { $in: sectionNames } }).lean();
    const btechSecByName = new Map(btechSections.map(s => [s.name, s]));
    const orderedSec = sectionNames.map(n => btechSecByName.get(n)).filter(Boolean);

    let studentCreated = 0, studentEnrolled = 0, studentErrors = [];
    for (let i=1;i<=100;i++){
      const userid = `22bcon${String(i).padStart(3,'0')}`;
      try {
        let u = await User.findOne({ userid });
        if (!u) {
          const passwordHash = await bcrypt.hash(userid, 10);
          u = await User.create({ userid, passwordHash, role: 'student', userDbName: userDbNameFor(userid) });
          studentCreated++;
        } else if (u.role !== 'student') {
          u.role = 'student'; await u.save();
        }
        const idx = Math.floor((i-1)/20); // 0..5
        const sec = orderedSec[idx];
        if (sec) {
          const exists = await Enrollment.findOne({ sectionId: String(sec._id), studentUserId: userid });
          if (!exists) { await Enrollment.create({ sectionId: String(sec._id), studentUserId: userid, joinedAt: new Date() }); studentEnrolled++; }
        }
      } catch (e) {
        studentErrors.push({ userid, error: e.message });
      }
    }

    // Create 20 teachers tchr001..020 with same password, no section allot
    let teacherCreated = 0, teacherErrors = [];
    for (let j=1;j<=20;j++){
      const userid = `tchr${String(j).padStart(3,'0')}`;
      try {
        let u = await User.findOne({ userid });
        if (!u) {
          const passwordHash = await bcrypt.hash(userid, 10);
          u = await User.create({ userid, passwordHash, role: 'teacher', userDbName: userDbNameFor(userid) });
          teacherCreated++;
        } else if (u.role !== 'teacher') {
          u.role = 'teacher'; await u.save();
        }
      } catch (e) {
        teacherErrors.push({ userid, error: e.message });
      }
    }

    const totalSections = await Section.countDocuments({});
    const totalCourses = await Course.countDocuments({});
    try { await AuditLog.create({ actorUserId: req.user.userid, action: 'maintenance.seedBasic', targetId: 'ALL', after: { studentCreated, studentEnrolled, teacherCreated }, ip: req.ip }); } catch {}
    res.json({ message: 'Seed completed', totals: { courses: totalCourses, sections: totalSections }, sectionCreatedPerCourse, studentCreated, studentEnrolled, studentErrors, teacherCreated, teacherErrors });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Seed failed' });
  }
});
router.post('/courses', async (req, res) => {
  const { Course, Section, AuditLog } = await models();
  const { name, code, department, year } = req.body || {};
  if (!name || !code) return res.status(400).json({ message: 'name, code required' });
  const doc = await Course.create({ name, code, department, year });
  try { await AuditLog.create({ actorUserId: req.user.userid, action: 'course.create', targetId: String(doc._id), after: { name, code, department, year }, ip: req.ip }); } catch {}
  // Ensure a 'notassigned' section exists for this course
  try {
    const existing = await Section.findOne({ courseId: String(doc._id), name: 'notassigned' }).lean();
    if (!existing) {
      await Section.create({ courseId: String(doc._id), name: 'notassigned', term: null, schedule: null, teachers: [] });
      try { await AuditLog.create({ actorUserId: req.user.userid, action: 'section.create', targetId: 'auto-notassigned', after: { courseId: String(doc._id), name: 'notassigned' }, ip: req.ip }); } catch {}
    }
  } catch {}
  res.status(201).json(doc);
});
router.put('/courses/:id', async (req, res) => {
  const { Course, AuditLog } = await models();
  const { name, code, department, year } = req.body || {};
  const before = await Course.findById(req.params.id).lean();
  const doc = await Course.findByIdAndUpdate(req.params.id, { name, code, department, year }, { new: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  try { await AuditLog.create({ actorUserId: req.user.userid, action: 'course.update', targetId: String(doc._id), before, after: { name, code, department, year }, ip: req.ip }); } catch {}
  res.json(doc);
});
router.delete('/courses/:id', async (req, res) => {
  const { Course, Section, AuditLog } = await models();
  const sCount = await Section.countDocuments({ courseId: req.params.id });
  if (sCount > 0) return res.status(400).json({ message: 'Cannot delete course with sections' });
  const before = await Course.findById(req.params.id).lean();
  await Course.deleteOne({ _id: req.params.id });
  try { await AuditLog.create({ actorUserId: req.user.userid, action: 'course.delete', targetId: String(req.params.id), before, ip: req.ip }); } catch {}
  res.json({ message: 'Deleted' });
});

// --- Sections CRUD ---
router.get('/sections', async (req, res) => {
  const { Section, Course } = await models();
  const q = {};
  if (req.query?.courseId) q.courseId = req.query.courseId;
  if (req.query?.name) q.name = req.query.name;
  const sections = await Section.find(q).lean();
  const courseIds = sections.map(s => s.courseId);
  const courses = courseIds.length ? await Course.find({ _id: { $in: courseIds } }, { name: 1, code: 1 }).lean() : [];
  const cMap = new Map(courses.map(c => [String(c._id), c]));
  res.json(sections.map(s => ({ ...s, course: cMap.get(String(s.courseId)) || null })));
});
router.post('/sections', async (req, res) => {
  try {
    const { Section, AuditLog } = await models();
    const { courseId, name, term, schedule } = req.body || {};
    if (!courseId || !name) return res.status(400).json({ message: 'courseId, name required' });
    const normalizedName = String(name).trim().toUpperCase();
    // Idempotent upsert per-course, case-insensitive name
    const ci = new RegExp('^' + String(normalizedName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
    const courseKey = Types.ObjectId.isValid(courseId) ? new Types.ObjectId(courseId) : courseId;
    const query = { name: ci, $or: [ { courseId: courseKey }, { courseId: String(courseId) } ] };
    const update = { $setOnInsert: { courseId: courseKey, name: normalizedName, term: term || null, schedule: schedule || null, teachers: [] } };
    const options = { new: true, upsert: true, lean: false }; // returns the found/inserted doc
    const doc = await Section.findOneAndUpdate(query, update, options);
    const existed = doc && doc.isNew === false; // best-effort
    try { await AuditLog.create({ actorUserId: req.user.userid, action: 'section.create', targetId: String(doc._id), after: { courseId, name, term }, ip: req.ip }); } catch {}
    return res.status(existed ? 200 : 201).json(existed ? { ...(doc.toObject?.()||doc), existed: true } : doc);
  } catch (e) {
    // Handle duplicate key error (unique index on courseId+name)
    if (e && (e.code === 11000 || e.code === 11001)) {
      // Fall back: try to find existing and return as success
      const { Section } = await models();
      const { courseId, name } = req.body || {};
      const normalizedName = String(name||'').trim().toUpperCase();
      const ci = new RegExp('^' + String(normalizedName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i');
      const courseKey = Types.ObjectId.isValid(courseId) ? new Types.ObjectId(courseId) : courseId;
      const query = { name: ci, $or: [ { courseId: courseKey }, { courseId: String(courseId) } ] };
      const existing = await Section.findOne(query).lean();
      if (existing) return res.status(200).json({ ...existing, existed: true });
      return res.status(409).json({ message: 'Section with this name already exists for the course (inconsistent state)' });
    }
    // Handle cast errors (invalid ObjectId)
    if (e && e.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid courseId' });
    }
    console.error('POST /admin/v2/sections failed:', e);
    return res.status(500).json({ message: 'Failed to create section' });
  }
});
router.put('/sections/:id', async (req, res) => {
  const { Section, AuditLog } = await models();
  const { name, term, schedule } = req.body || {};
  const before = await Section.findById(req.params.id).lean();
  const doc = await Section.findByIdAndUpdate(req.params.id, { name, term, schedule }, { new: true });
  if (!doc) return res.status(404).json({ message: 'Not found' });
  try { await AuditLog.create({ actorUserId: req.user.userid, action: 'section.update', targetId: String(doc._id), before, after: { name, term, schedule }, ip: req.ip }); } catch {}
  res.json(doc);
});
router.delete('/sections/:id', async (req, res) => {
  const { Section, Enrollment, Assignment, AttendanceSession, AuditLog } = await models();
  const before = await Section.findById(req.params.id).lean();
  if (before && before.name === 'notassigned') return res.status(400).json({ message: 'Cannot delete notassigned section' });
  await Enrollment.deleteMany({ sectionId: req.params.id });
  await Assignment.deleteMany({ sectionId: req.params.id });
  await AttendanceSession.deleteMany({ sectionId: req.params.id });
  await Section.deleteOne({ _id: req.params.id });
  try { await AuditLog.create({ actorUserId: req.user.userid, action: 'section.delete', targetId: String(req.params.id), before, ip: req.ip }); } catch {}
  res.json({ message: 'Deleted' });
});

// --- Teacher assignment ---
router.get('/teachers', async (req, res) => {
  const { User } = await models();
  const teachers = await User.find({ role: 'teacher' }, { userid: 1, name: 1, fullName: 1, email: 1 }).lean();
  res.json(teachers.map(t => ({ userid: t.userid, name: t.fullName || t.name || t.userid, email: t.email || '' })));
});
router.post('/sections/:id/teachers', async (req, res) => {
  const { Section, AuditLog } = await models();
  const { teacherUserIds = [] } = req.body || {};
  const unique = Array.from(new Set(teacherUserIds.filter(Boolean)));
  const doc = await Section.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Section not found' });
  const set = new Set([...(doc.teachers || []), ...unique]);
  // migrate legacy field to teachers[] if present
  if (doc.teacherUserId) set.add(doc.teacherUserId);
  doc.teachers = Array.from(set);
  doc.teacherUserId = undefined;
  await doc.save();
  try { await AuditLog.create({ actorUserId: req.user.userid, action: 'section.assignTeachers', targetId: String(doc._id), after: { teachers: doc.teachers }, ip: req.ip }); } catch {}
  res.json({ message: 'Teachers assigned', teachers: doc.teachers });
});
router.delete('/sections/:id/teachers/:teacherUserId', async (req, res) => {
  const { Section, AuditLog } = await models();
  const doc = await Section.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Section not found' });
  doc.teachers = (doc.teachers || []).filter(u => u !== req.params.teacherUserId);
  await doc.save();
  try { await AuditLog.create({ actorUserId: req.user.userid, action: 'section.unassignTeacher', targetId: String(doc._id), after: { teachers: doc.teachers }, ip: req.ip }); } catch {}
  res.json({ message: 'Teacher unassigned', teachers: doc.teachers });
});

// --- Section Students ---
router.get('/sections/:id/students', async (req, res) => {
  const { Enrollment, User } = await models();
  const ens = await Enrollment.find({ sectionId: req.params.id }).lean();
  const ids = ens.map(e => e.studentUserId);
  const users = ids.length ? await User.find({ userid: { $in: ids } }, { userid: 1, name: 1, fullName: 1, email: 1 }).lean() : [];
  const map = new Map(users.map(u => [u.userid, u]));
  const result = ens.map(e => ({ userid: e.studentUserId, name: (map.get(e.studentUserId)?.fullName) || (map.get(e.studentUserId)?.name) || e.studentUserId, email: map.get(e.studentUserId)?.email || '' }));
  res.json(result);
});

router.post('/sections/:id/enroll', async (req, res) => {
  const { Enrollment, Section, User, AuditLog } = await models();
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ message: 'userId required' });
  const sec = await Section.findById(req.params.id).lean();
  if (!sec) return res.status(404).json({ message: 'Section not found' });
  const user = await User.findOne({ userid: userId, role: 'student' }).lean();
  if (!user) return res.status(400).json({ message: 'User not found or not a student' });
  const exists = await Enrollment.findOne({ sectionId: req.params.id, studentUserId: userId }).lean();
  if (exists) return res.status(400).json({ message: 'Already enrolled' });
  const doc = await Enrollment.create({ sectionId: req.params.id, studentUserId: userId, joinedAt: new Date() });
  try { await AuditLog.create({ actorUserId: req.user.userid, action: 'enrollment.add', targetId: String(req.params.id), after: { studentUserId: userId }, ip: req.ip }); } catch {}
  res.status(201).json(doc);
});

// --- Bulk CSV Enrollment ---
// Accepts JSON body { csvText: string } with header containing userId
router.post('/sections/:id/enrollments/csv', async (req, res) => {
  const { Section, Enrollment, User, AuditLog } = await models();
  const sec = await Section.findById(req.params.id).lean();
  if (!sec) return res.status(404).json({ message: 'Section not found' });
  const csv = (req.body && (req.body.csvText || req.body.csv)) || '';
  if (!csv.trim()) return res.status(400).json({ message: 'csvText required' });
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return res.status(400).json({ message: 'Empty CSV' });
  const header = lines[0].split(',').map(h=>h.trim());
  const uidIdx = header.findIndex(h => /^userId$/i.test(h));
  if (uidIdx === -1) return res.status(400).json({ message: 'CSV must include userId column' });
  let total = 0, successCount = 0, failureCount = 0; const rows = [];
  for (let i=1;i<lines.length;i++){
    total++;
    const cols = lines[i].split(',');
    const userId = (cols[uidIdx]||'').trim();
    const resp = { rowNumber: i+1, userId };
    try{
      if (!userId) throw new Error('Missing userId');
      const user = await User.findOne({ userid: userId, role: 'student' }).lean();
      if (!user) throw new Error('User not found or not a student');
      const exists = await Enrollment.findOne({ sectionId: req.params.id, studentUserId: userId }).lean();
      if (exists) throw new Error('Already enrolled');
      await Enrollment.create({ sectionId: req.params.id, studentUserId: userId, joinedAt: new Date() });
      resp.status = 'success'; successCount++;
    }catch(e){ resp.status = 'failure'; resp.reason = e.message; failureCount++; }
    rows.push(resp);
  }
  try { await AuditLog.create({ actorUserId: req.user.userid, action: 'enrollment.bulkCsv', targetId: String(req.params.id), after: { total, successCount, failureCount }, ip: req.ip }); } catch {}
  res.json({ total, successCount, failureCount, rows });
});

module.exports = router;
 
// --- Maintenance: Wipe academic data ---
// DANGER: Deletes Courses, Sections, Enrollments, Assignments, Submissions, AttendanceSessions, and non-admin Users
// Keep admin users as-is. Intended for dev/demo reset.
router.post('/maintenance/wipe', async (req, res) => {
  const { Course, Section, Enrollment, Assignment, Submission, AttendanceSession, User, AuditLog } = await models();
  try {
    const result = {};
    result.courses = await Course.deleteMany({});
    result.sections = await Section.deleteMany({});
    result.enrollments = await Enrollment.deleteMany({});
    result.assignments = await Assignment.deleteMany({});
    result.submissions = await Submission.deleteMany({});
    result.attendance = await AttendanceSession.deleteMany({});
    // Delete all users that are not admin
    result.users = await User.deleteMany({ role: { $ne: 'admin' } });
    try { await AuditLog.create({ actorUserId: req.user.userid, action: 'maintenance.wipe', targetId: 'ALL', after: { summary: 'wiped academic data' }, ip: req.ip }); } catch {}
    res.json({ message: 'Wipe completed', result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Wipe failed' });
  }
});
