import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import api from '../api/client';

export default function AdminTeachers(){
  const [teachers, setTeachers] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [courseId, setCourseId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState('');

  const load = async ()=>{
    try { const rt = await api.get('/admin/v2/teachers'); setTeachers(rt.data||[]); if(rt.data?.length && !selectedTeacher) setSelectedTeacher(rt.data[0].userid);} catch {}
    try { const rs = await api.get('/admin/v2/sections'); setSections(rs.data||[]);} catch {}
    try { const rc = await api.get('/admin/v2/courses'); setCourses(rc.data||[]); if(rc.data?.length && !courseId) setCourseId(rc.data[0]._id);} catch {}
  };
  useEffect(()=>{ load(); /* eslint-disable-next-line */ },[]);

  const teacherSections = useMemo(()=> (sections||[]).filter(s=> (s.teachers||[]).includes(selectedTeacher)), [sections, selectedTeacher]);
  const courseSections = useMemo(()=> (sections||[]).filter(s=> String(s.courseId)===String(courseId)), [sections, courseId]);

  const allot = async ()=>{
    if (!selectedTeacher || !sectionId) return; setStatus('');
    const sec = sections.find(s=> String(s._id)===String(sectionId));
    const next = Array.from(new Set([...(sec?.teachers||[]), selectedTeacher]));
    await api.post(`/admin/v2/sections/${sectionId}/teachers`, { teacherUserIds: next });
    setStatus('Allotted');
    setSectionId('');
    load();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb:2 }}>Teachers</Typography>
      {status && <Typography color="primary" sx={{ mb:1 }}>{status}</Typography>}
      <Paper sx={{ p:2, mb:2 }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
          <TextField size="small" select label="Teacher" value={selectedTeacher} onChange={e=>setSelectedTeacher(e.target.value)} sx={{ minWidth: 260 }}>
            {(teachers||[]).map(t=> (<MenuItem key={t.userid} value={t.userid}>{t.name} ({t.userid})</MenuItem>))}
          </TextField>
        </Stack>
      </Paper>

      <Paper sx={{ p:2, mb:2 }}>
        <Typography fontWeight={600} sx={{ mb:1 }}>Currently allotted</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {(teacherSections||[]).map(s=> (<Chip key={s._id} label={`${s.course?.code||''} • ${s.name}`} />))}
        </Stack>
      </Paper>

      <Paper sx={{ p:2 }}>
        <Typography fontWeight={600} sx={{ mb:1 }}>Allot Sections</Typography>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={1} alignItems="center">
          <TextField size="small" select label="Select course" value={courseId} onChange={e=>setCourseId(e.target.value)} sx={{ minWidth: 240 }}>
            {(courses||[]).map(c=> (<MenuItem key={c._id} value={c._id}>{c.name} ({c.code})</MenuItem>))}
          </TextField>
          <TextField size="small" select label="Select section" value={sectionId} onChange={e=>setSectionId(e.target.value)} sx={{ minWidth: 240 }}>
            {(courseSections||[]).map(s=> (<MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>))}
          </TextField>
          <Button variant="contained" onClick={allot}>Allot</Button>
        </Stack>
      </Paper>
    </Box>
  );
}
