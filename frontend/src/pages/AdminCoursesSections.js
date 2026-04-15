import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Divider, List, ListItemButton, ListItemText, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import api from '../api/client';

export default function AdminCoursesSections(){
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [newCourse, setNewCourse] = useState({ name:'', code:'' });
  const [newSectionName, setNewSectionName] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [roster, setRoster] = useState([]);
  const [addUserId, setAddUserId] = useState('');
  const [status, setStatus] = useState('');

  const load = async ()=>{
    try{ const rc = await api.get('/admin/v2/courses'); setCourses(rc.data||[]); if(rc.data?.length && !selectedCourseId) setSelectedCourseId(rc.data[0]._id);}catch{}
    try{ const rs = await api.get('/admin/v2/sections'); setSections(rs.data||[]);}catch{}
  };
  useEffect(()=>{ load(); /* eslint-disable-next-line */ },[]);

  const courseSections = useMemo(()=> (sections||[]).filter(s=>String(s.courseId)===String(selectedCourseId)), [sections, selectedCourseId]);
  const courseMap = useMemo(()=>Object.fromEntries((courses||[]).map(c=>[String(c._id), c])), [courses]);

  const addCourse = async (e)=>{
    e && e.preventDefault(); setStatus('');
    if (!newCourse.name || !newCourse.code) { setStatus('Course name and code required'); return; }
    await api.post('/admin/v2/courses', newCourse);
    setNewCourse({ name:'', code:'' });
    setStatus('Course created');
    load();
  };

  const addSection = async (e)=>{
    e && e.preventDefault(); setStatus('');
    if (!selectedCourseId) { setStatus('Select a course'); return; }
    if (!newSectionName) { setStatus('Section name required'); return; }
    try {
      await api.post('/admin/v2/sections', { courseId: selectedCourseId, name: newSectionName });
      setStatus('Section created');
    } catch (err) {
      const code = err?.response?.status;
      if (code === 409) {
        setStatus('Section already exists');
      } else {
        setStatus(err?.response?.data?.message || 'Failed to create section');
        return;
      }
    } finally {
      setNewSectionName('');
      load();
    }
  };

  const openSection = async (sec)=>{
    setSelectedSection(sec);
    setStatus(''); setRoster([]); setAddUserId('');
    try{ const r = await api.get(`/admin/v2/sections/${sec._id}/students`); setRoster(r.data||[]);}catch{}
  };

  const enrollOne = async (e)=>{
    e && e.preventDefault(); setStatus('');
    if (!selectedSection || !addUserId) return;
    try{ await api.post(`/admin/v2/sections/${selectedSection._id}/enroll`, { userId: addUserId }); setStatus('Student enrolled'); setAddUserId(''); openSection(selectedSection); }catch(err){ setStatus(err?.response?.data?.message || 'Failed'); }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb:2 }}>Courses & Sections</Typography>
      {status && <Typography color="primary" sx={{ mb:1 }}>{status}</Typography>}
      <Stack direction={{ xs:'column', md:'row' }} spacing={2}>
        <Paper sx={{ p:2, width: 320 }}>
          <Typography fontWeight={600} sx={{ mb:1 }}>Courses</Typography>
          <Stack component="form" spacing={1} onSubmit={addCourse} sx={{ mb:2 }}>
            <TextField size="small" label="Course Name" value={newCourse.name} onChange={e=>setNewCourse(v=>({...v,name:e.target.value}))} />
            <TextField size="small" label="Course Code" value={newCourse.code} onChange={e=>setNewCourse(v=>({...v,code:e.target.value}))} />
            <Button type="submit" variant="outlined">Add Course</Button>
          </Stack>
          <Divider sx={{ my:1 }} />
          <List>
            {(courses||[]).map(c=> (
              <ListItemButton key={c._id} selected={String(selectedCourseId)===String(c._id)} onClick={()=>{setSelectedCourseId(c._id); setSelectedSection(null);}}>
                <ListItemText primary={`${c.name} (${c.code})`} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
        <Paper sx={{ p:2, flex: 1 }}>
          <Typography fontWeight={600} sx={{ mb:1 }}>Sections under {courseMap[selectedCourseId]?.name || '—'}</Typography>
          <Stack direction={{ xs:'column', sm:'row' }} spacing={1} component="form" onSubmit={addSection} sx={{ mb:2 }}>
            <TextField size="small" label="New Section Name" value={newSectionName} onChange={e=>setNewSectionName(e.target.value)} />
            <Button type="submit" variant="contained">Add Section</Button>
          </Stack>
          <Stack direction={{ xs:'column', md:'row' }} spacing={2}>
            <Paper sx={{ p:1, width: 320 }}>
              <List>
                {(courseSections||[]).map(s=> (
                  <ListItemButton key={s._id} selected={selectedSection? String(selectedSection._id)===String(s._id):false} onClick={()=>openSection(s)}>
                    <ListItemText primary={s.name} secondary={`Teachers: ${(s.teachers||[]).length} • Enrolled: ${s.enrollmentCount ?? ''}`} />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
            <Paper sx={{ p:2, flex: 1 }}>
              <Typography fontWeight={600} sx={{ mb:1 }}>Section Details</Typography>
              {selectedSection ? (
                <>
                  <Typography variant="subtitle2" sx={{ mb:1 }}>{selectedSection.name} • {courseMap[selectedCourseId]?.name} ({courseMap[selectedCourseId]?.code})</Typography>
                  <Stack direction={{ xs:'column', sm:'row' }} spacing={1} component="form" onSubmit={enrollOne} sx={{ mb:2 }}>
                    <TextField size="small" label="Add student by userId" value={addUserId} onChange={e=>setAddUserId(e.target.value)} />
                    <Button type="submit" variant="contained">Add</Button>
                  </Stack>
                  <Typography variant="subtitle2">Students</Typography>
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {(roster||[]).map((u,i)=> (
                      <Typography key={i} variant="body2">{u.name} ({u.userid})</Typography>
                    ))}
                  </Box>
                </>
              ) : (
                <Typography variant="body2">Select a section to view its students</Typography>
              )}
            </Paper>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
