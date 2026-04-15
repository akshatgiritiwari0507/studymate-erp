require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectMain } = require('./config/db');

const app = express();
// CORS configuration (dev): reflect request origin to support localhost and LAN IP
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Basic request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Extra permissive CORS headers for dev to avoid preflight issues
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Ensure main DB connection
connectMain(process.env.MONGODB_URI).then(() => {
  console.log('Connected to main DB');
}).catch(err => {
  console.error('Main DB connection error:', err);
  process.exit(1);
});

app.get('/', (req, res) => res.send('RBAC LMS API running'));

app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/admin/v2', require('./routes/admin.v2'));
app.use('/teacher', require('./routes/teacher'));
app.use('/student', require('./routes/student'));
app.use('/common', require('./routes/common'));
app.use('/api', require('./routes/api'));
app.use('/teacher/v2', require('./routes/teacher.v2'));
app.use('/student/v2', require('./routes/student.v2'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`RBAC LMS server listening on ${PORT}`));
