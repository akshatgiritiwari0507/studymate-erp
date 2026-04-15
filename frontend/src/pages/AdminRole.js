import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import api from '../api/client';

export default function AdminRole() {
  // Search + role edit
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [savingRole, setSavingRole] = useState('');
  const [status, setStatus] = useState('');

  const search = async ()=>{
    setStatus('');
    if (!q.trim()) { setResults([]); return; }
    try { const r = await api.get('/admin/v2/users/search', { params: { q } }); setResults(r.data||[]); } catch {}
  };

  // Enrollment (course/section) for a student
  const [studentId, setStudentId] = useState('');
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState('');

  useEffect(()=>{ (async()=>{ try{ const rc=await api.get('/admin/v2/courses'); setCourses(rc.data||[]);}catch{} })(); },[]);
  useEffect(()=>{ (async()=>{ if(!courseId){ setSections([]); setSectionId(''); return;} try{ const rs=await api.get('/admin/v2/sections', { params: { courseId } }); setSections(rs.data||[]); setSectionId(prev=> prev && rs.data.find(s=>String(s._id)===String(prev))? prev : (rs.data[0]?._id||'')); }catch{} })(); }, [courseId]);

  const saveRole = async (userid, newRole)=>{
    try{
      setSavingRole(userid);
      await api.post(`/admin/users/${encodeURIComponent(userid)}/role`, { role: newRole });
      setStatus(`Role updated for ${userid}`);
    } finally {
      setSavingRole('');
    }
  };

  const saveEnrollment = async ()=>{
    if (!studentId || !courseId || !sectionId) return;
    await api.post('/admin/v2/students/enrollment', { studentUserId: studentId, courseId, sectionId });
    setStatus('Enrollment updated');
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb:2 }}>Role & Enrollment</Typography>
      {status && <Typography color="primary" sx={{ mb:1 }}>{status}</Typography>}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:2 }}>
            <Typography variant="h6" sx={{ mb:1 }}>Search & Set Role</Typography>
            <Stack direction={{ xs:'column', sm:'row' }} spacing={1} sx={{ mb:2 }}>
              <TextField size="small" fullWidth label="Search by userid/name" value={q} onChange={e=>setQ(e.target.value)} />
              <Button variant="outlined" onClick={search}>Search</Button>
            </Stack>
            <Stack spacing={1}>
              {(results||[]).map(u=> (
                <Stack key={u._id||u.userid} direction={{ xs:'column', sm:'row' }} spacing={1} alignItems="center">
                  <Typography sx={{ minWidth: 160 }}>{u.userid}</Typography>
                  <TextField size="small" select value={u.role||'student'} onChange={e=>{ const role=e.target.value; saveRole(u.userid, role); }} disabled={savingRole===u.userid}>
                    <MenuItem value="student">student</MenuItem>
                    <MenuItem value="teacher">teacher</MenuItem>
                    <MenuItem value="admin">admin</MenuItem>
                  </TextField>
                </Stack>
              ))}
              {results.length===0 && <Typography color="text.secondary">No users</Typography>}
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:2 }}>
            <Typography variant="h6" sx={{ mb:1 }}>Set Student Course & Section</Typography>
            <Stack spacing={1}>
              <TextField size="small" label="Student UserID" value={studentId} onChange={e=>setStudentId(e.target.value)} />
              <TextField size="small" select label="Course" value={courseId} onChange={e=>setCourseId(e.target.value)}>
                {(courses||[]).map(c=> (<MenuItem key={c._id} value={c._id}>{c.name} ({c.code})</MenuItem>))}
              </TextField>
              <TextField size="small" select label="Section" value={sectionId} onChange={e=>setSectionId(e.target.value)}>
                {(sections||[]).map(s=> (<MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>))}
              </TextField>
              <Button variant="contained" onClick={saveEnrollment}>Save</Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
