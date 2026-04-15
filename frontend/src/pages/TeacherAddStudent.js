import React, { useEffect, useState } from 'react';
import { Box, Button, Grid, Paper, Stack, TextField, Typography } from '@mui/material';
import api from '../api/client';

export default function TeacherAddStudent() {
  const [studentUserId, setStudentUserId] = useState('');
  const [status, setStatus] = useState('');
  const [mapped, setMapped] = useState([]);
  const [sections, setSections] = useState([]);

  const load = async () => {
    try {
      const [m, s] = await Promise.all([
        api.get('/teacher/students'),
        api.get('/teacher/sections')
      ]);
      setMapped(m.data||[]);
      setSections(s.data||[]);
    } catch {}
  };

  useEffect(()=>{ load(); },[]);

  const addStudent = async () => {
    if (!studentUserId) return;
    setStatus('');
    await api.post('/teacher/students/add', { studentUserId });
    setStatus('Student mapped to you');
    setStudentUserId('');
    load();
  };

  const removeStudent = async (id) => {
    setStatus('');
    await api.post('/teacher/students/remove', { studentUserId: id });
    setStatus('Student removed');
    load();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb:2 }}>Add Student</Typography>
      {status && <Typography color="primary" sx={{ mb:1 }}>{status}</Typography>}
      <Paper sx={{ p:2, mb:2 }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={1}>
          <TextField size="small" label="Student UserID" value={studentUserId} onChange={e=>setStudentUserId(e.target.value)} />
          <Button variant="contained" onClick={addStudent}>Map to Me</Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt:1 }}>
          Note: Section assignment is managed by Admin; see Admin panel to set a student's section.
        </Typography>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:2 }}>
            <Typography variant="h6" sx={{ mb:1 }}>Your Mapped Students</Typography>
            <pre style={{ background:'#f7f7f7', padding:12, maxHeight:240, overflow:'auto' }}>{JSON.stringify(mapped, null, 2)}</pre>
            <Stack direction={{ xs:'column', sm:'row' }} spacing={1}>
              <TextField size="small" label="UserID to remove" onKeyDown={(e)=>{ if(e.key==='Enter'){ removeStudent(e.target.value); e.target.value=''; } }} />
              <Button variant="outlined" color="error" onClick={()=>{
                const input = document.querySelector('#removeUserId');
                if (input?.value) removeStudent(input.value);
              }} sx={{ display:'none' }}>Remove</Button>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:2 }}>
            <Typography variant="h6" sx={{ mb:1 }}>Your Sections</Typography>
            <pre style={{ background:'#f7f7f7', padding:12, maxHeight:240, overflow:'auto' }}>{JSON.stringify(sections, null, 2)}</pre>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
