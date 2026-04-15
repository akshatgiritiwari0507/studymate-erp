import React, { useEffect, useState } from 'react';
import { Box, Button, Checkbox, FormControlLabel, Grid, MenuItem, Paper, Stack, TextField, Typography, Card, CardContent, Chip } from '@mui/material';
import api from '../api/client';

export default function TeacherAttendanceBySection() {
  const [sections, setSections] = useState([]);
  const [section, setSection] = useState(''); // sectionId
  const [enrollments, setEnrollments] = useState([]);
  const [date, setDate] = useState('');
  const [present, setPresent] = useState({});
  const [status, setStatus] = useState('');

  const loadSections = async()=>{ try{ const r=await api.get('/teacher/v2/sections'); setSections(r.data||[]);}catch{} };
  const loadEnrollments = async(id)=>{ try{ const r=await api.get(`/teacher/v2/sections/${encodeURIComponent(id)}/enrollments`); setEnrollments(r.data||[]); setPresent({}); }catch{} };

  useEffect(()=>{ loadSections(); },[]);
  useEffect(()=>{ if(section) loadEnrollments(section); },[section]);

  const toggle = (uid)=> setPresent(p=>({ ...p, [uid]: !p[uid] }));

  const submit = async ()=>{
    if (!section || !date) return;
    setStatus('');
    const presentUserIds = Object.entries(present).filter(([,v])=>v).map(([k])=>k);
    try{
      await api.post(`/teacher/v2/sections/${encodeURIComponent(section)}/attendance`, { date, presentUserIds });
      setStatus('Attendance recorded');
    }catch(e){ setStatus(e?.response?.data?.message || 'Failed to record'); }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', py: 6 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 4, borderRadius: 4, background: 'rgba(255,255,255,0.6)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d3a4a', mb: 4 }}>Attendance by Section</Typography>
        {status && <Typography color="primary" sx={{ mb: 2, p: 1, backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 2 }}>{status}</Typography>}
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, background: 'rgba(255,255,255,0.7)', boxShadow: '0 4px 16px rgba(31, 38, 135, 0.1)' }}>
              <Stack spacing={3}>
                <TextField select fullWidth label="Section" value={section} onChange={e=>setSection(e.target.value)} sx={{ backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 2 }}>
                  {(sections||[]).map(s=> (<MenuItem key={s._id} value={s._id}>{s.name}{typeof s.enrollmentCount==='number' ? ` (${s.enrollmentCount})` : ''}</MenuItem>))}
                </TextField>
                <TextField fullWidth label="Date" type="date" InputLabelProps={{ shrink:true }} value={date} onChange={e=>setDate(e.target.value)} sx={{ backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 2 }} />
                <Button variant="contained" onClick={submit} disabled={!section || !date} sx={{ borderRadius: 2, fontWeight: 600 }}>Save Attendance</Button>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Students</Typography>
            {(!enrollments || enrollments.length === 0) ? (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, background: 'rgba(255,255,255,0.7)' }}>
                <Typography color="text.secondary">No students enrolled in this section.</Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {enrollments.map(en => (
                  <Card key={en.studentUserId} sx={{ borderRadius: 3, background: 'rgba(255,255,255,0.7)', boxShadow: '0 4px 16px rgba(31, 38, 135, 0.1)', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(31, 38, 135, 0.15)' } }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{en.studentUserId}</Typography>
                      <FormControlLabel
                        control={<Checkbox checked={!!present[en.studentUserId]} onChange={()=>toggle(en.studentUserId)} color="primary" />}
                        label={present[en.studentUserId] ? "Present" : "Absent"}
                        sx={{ mr: 0 }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
