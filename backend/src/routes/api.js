const express = require('express');
const auth = require('../middleware/auth');
const { getUserConnection } = require('../config/db');
const buildTodo = require('../models/user/Todo');
const buildTimetable = require('../models/user/Timetable');

const router = express.Router();
router.use(auth); // require auth; ignore unauthenticated access

async function getModels(userid){
  const conn = await getUserConnection(process.env.MONGODB_URI, userid);
  return {
    Todo: buildTodo(conn),
    Timetable: buildTimetable(conn)
  };
}

// --- Timetable compatibility ---
// GET /api/timetable?role=student|teacher (role optional; we use req.user)
router.get('/timetable', async (req, res) => {
  try {
    const userId = req.user.userid;
    const { Timetable } = await getModels(userId);
    const days = await Timetable.find({}).lean();
    // Flatten to entries like { day, timeSlot, subject, room }
    const out = [];
    for (const d of days){
      for (const e of (d.entries || [])){
        out.push({ day: d.day, timeSlot: e.time, subject: e.subject || '', room: e.room || '' });
      }
    }
    res.json(out);
  } catch (e) {
    console.error(e); res.status(500).json({ message: 'Failed to fetch timetable' });
  }
});

// POST /api/timetable  { day, timeSlot, subject, room }
router.post('/timetable', async (req, res) => {
  try {
    const userId = req.user.userid;
    const { day, timeSlot, subject, room } = req.body || {};
    if (!day || !timeSlot || !subject) return res.status(400).json({ message: 'day, timeSlot, subject required' });
    const { Timetable } = await getModels(userId);
    let doc = await Timetable.findOne({ day });
    if (!doc) doc = await Timetable.create({ day, entries: [] });
    const idx = (doc.entries||[]).findIndex(e => e.time === timeSlot);
    if (idx >= 0) { doc.entries[idx] = { ...(doc.entries[idx]||{}), time: timeSlot, subject, room }; }
    else { doc.entries.push({ time: timeSlot, subject, room }); }
    await doc.save();
    return res.status(201).json({ day, timeSlot, subject, room });
  } catch (e) {
    console.error(e); res.status(400).json({ message: 'Failed to add class' });
  }
});

// DELETE /api/timetable?role=...  -> clear all for current user
router.delete('/timetable', async (req, res) => {
  try {
    const userId = req.user.userid;
    const { Timetable } = await getModels(userId);
    await Timetable.deleteMany({});
    res.json({ message: 'Cleared timetable' });
  } catch (e) {
    console.error(e); res.status(500).json({ message: 'Failed to clear timetable' });
  }
});

// --- Todo compatibility ---
// GET /api/todos?role=student|teacher (role optional; we use req.user)
router.get('/todos', async (req, res) => {
  try {
    const userId = req.user.userid;
    const { Todo } = await getModels(userId);
    const rows = await Todo.find({}).lean();
    // map { _id, title, status }
    res.json(rows.map(r => ({ _id: r._id, title: r.text || '', status: r.done ? 'Completed' : 'Pending' })));
  } catch (e) {
    console.error(e); res.status(500).json({ message: 'Failed to fetch todos' });
  }
});

// POST /api/todos { title, description, status }
router.post('/todos', async (req, res) => {
  try {
    const userId = req.user.userid;
    const { Todo } = await getModels(userId);
    const { title, status } = req.body || {};
    if (!title) return res.status(400).json({ message: 'title required' });
    const doc = await Todo.create({ text: title, done: status === 'Completed' });
    res.status(201).json({ _id: doc._id, title, status: doc.done ? 'Completed' : 'Pending' });
  } catch (e) {
    console.error(e); res.status(400).json({ message: 'Failed to add todo' });
  }
});

// PATCH /api/todos/:id { status }
router.patch('/todos/:id', async (req, res) => {
  try {
    const userId = req.user.userid;
    const { Todo } = await getModels(userId);
    const { status } = req.body || {};
    const done = status === 'Completed';
    const doc = await Todo.findByIdAndUpdate(req.params.id, { done }, { new: true });
    if (!doc) return res.status(404).json({ message: 'Todo not found' });
    res.json({ _id: doc._id, title: doc.text || '', status: doc.done ? 'Completed' : 'Pending' });
  } catch (e) {
    console.error(e); res.status(400).json({ message: 'Failed to update todo' });
  }
});

// DELETE /api/todos/:id
router.delete('/todos/:id', async (req, res) => {
  try {
    const userId = req.user.userid;
    const { Todo } = await getModels(userId);
    const r = await Todo.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ message: 'Todo not found' });
    res.json({ message: 'Todo deleted' });
  } catch (e) {
    console.error(e); res.status(500).json({ message: 'Failed to delete todo' });
  }
});

module.exports = router;
