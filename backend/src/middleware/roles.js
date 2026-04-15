function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

module.exports = {
  adminOnly: requireRole('admin'),
  teacherOnly: requireRole('teacher'),
  studentOnly: requireRole('student')
};
