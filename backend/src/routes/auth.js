const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectMain } = require('../config/db');
const buildUserModel = require('../models/main/User');
const { userDbNameFor, getUserConnection } = require('../config/db');
const auth = require('../middleware/auth');
const buildCourse = require('../models/main/Course');
const buildSection = require('../models/main/Section');
const buildEnrollment = require('../models/main/Enrollment');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { userid, password, courseId } = req.body || {};
    if (!userid || !password) return res.status(400).json({ message: 'userid and password required' });

    const main = await connectMain(process.env.MONGODB_URI);
    const User = buildUserModel(main);
    const Course = buildCourse(main);
    const Section = buildSection(main);
    const Enrollment = buildEnrollment(main);

    const existing = await User.findOne({ userid });
    if (existing) return res.status(400).json({ message: 'User exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const userDbName = userDbNameFor(userid);

    // If courseId is provided, this is a student signup flow
    const role = courseId ? 'student' : null;
    await User.create({ userid, passwordHash, role, userDbName });

    // Create user DB and initialize collections by creating empty docs
    const userConn = await getUserConnection(process.env.MONGODB_URI, userid);
    await Promise.all([
      userConn.collection('timetable').insertOne({ __init: true }),
      userConn.collection('todo').insertOne({ __init: true }),
      userConn.collection('assignments').insertOne({ __init: true }),
      userConn.collection('attendance').insertOne({ __init: true }),
      userConn.collection('notices').insertOne({ __init: true }),
      userConn.collection('profile').insertOne({ __init: true })
    ]);

    // If student signup with course selection, auto-enroll in that course's 'notassigned' section (case-insensitive)
    if (courseId) {
      const course = await Course.findById(courseId).lean();
      if (!course) return res.status(400).json({ message: 'Invalid courseId' });
      
      // Find or create a 'NOTASSIGNED' section (case-insensitive)
      let section = await Section.findOne({
        courseId: String(course._id),
        name: { $regex: '^notassigned$', $options: 'i' } // Case-insensitive match
      }).lean();

      if (!section) {
        try {
          section = await Section.create({
            courseId: String(course._id),
            name: 'NOTASSIGNED', // Always use uppercase for consistency
            term: null,
            schedule: null,
            teachers: []
          });
        } catch (error) {
          console.error('Error creating NOTASSIGNED section:', error);
          // If creation fails (e.g., due to race condition), try to find it again
          section = await Section.findOne({
            courseId: String(course._id),
            name: { $regex: '^notassigned$', $options: 'i' }
          }).lean();
          
          if (!section) {
            console.error('Failed to create or find NOTASSIGNED section');
            return res.status(500).json({ message: 'Failed to process course enrollment' });
          }
        }
      }

      // Check if student is already enrolled in any section of this course
      const existingEnrollment = await Enrollment.findOne({
        'section.courseId': String(course._id),
        studentUserId: userid
      }).lean();

      if (!existingEnrollment) {
        await Enrollment.create({
          sectionId: String(section._id),
          section: {
            _id: section._id,
            name: section.name,
            courseId: section.courseId
          },
          studentUserId: userid,
          joinedAt: new Date(),
          status: 'active'
        });
        
        console.log(`Student ${userid} enrolled in course ${course.name} (${courseId}) in section NOTASSIGNED`);
      }
    }

    return res.json({ message: 'User created', userDbName, role: role || undefined });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Signup failed' });
  }
});

// Public list of courses for signup course selection
router.get('/courses', async (req, res) => {
  try {
    const main = await connectMain(process.env.MONGODB_URI);
    const Course = buildCourse(main);
    const rows = await Course.find({}, { name: 1, code: 1 }).lean();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to list courses' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { userid, password } = req.body;

    // Admin bypass
    if (userid === 'admin' && password === 'admin') {
      const token = jwt.sign({ userid, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, role: 'admin' });
    }

    const main = await connectMain(process.env.MONGODB_URI);
    const User = buildUserModel(main);
    const user = await User.findOne({ userid });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userid: user.userid, role: user.role || 'student' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, role: user.role || 'student' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Login failed' });
  }
});

// Change password (self)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'oldPassword and newPassword required' });
    const main = await connectMain(process.env.MONGODB_URI);
    const User = buildUserModel(main);
    const user = await User.findOne({ userid: req.user.userid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Old password incorrect' });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ message: 'Password changed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Change password failed' });
  }
});

module.exports = router;
