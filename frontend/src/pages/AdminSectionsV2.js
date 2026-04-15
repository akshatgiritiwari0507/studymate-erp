import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemText, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/client';

export default function AdminSectionsV2(){
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ courseId:'', name:'', term:'' });
  const [status, setStatus] = useState('');
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvSectionId, setCsvSectionId] = useState('');
  const [csvText, setCsvText] = useState('userId\n');
  const [csvResult, setCsvResult] = useState(null);

  const load = async ()=>{
    try { const rc = await api.get('/admin/v2/courses'); setCourses(rc.data||[]); if(rc.data?.length && !form.courseId) setForm(f=>({...f,courseId:rc.data[0]._id})); } catch {}
    try { const rs = await api.get('/admin/v2/sections'); setSections(rs.data||[]); } catch {}
    try { const rt = await api.get('/admin/v2/teachers'); setTeachers(rt.data||[]); } catch {}
  };
  useEffect(()=>{ load(); /* eslint-disable-next-line */ },[]);

  const addSection = async (e)=>{
    e && e.preventDefault(); setStatus('');
    if (!form.courseId || !form.name) return;
    await api.post('/admin/v2/sections', { courseId: form.courseId, name: form.name, term: form.term });
    setForm(f=>({ ...f, name:'', term:'' }));
    setStatus('Section created'); load();
  };

  const removeSection = async (id)=>{
    setStatus(''); await api.delete(`/admin/v2/sections/${id}`); setStatus('Section deleted'); load();
  };

  const assignTeachers = async (sectionId, selectedIds)=>{
    setStatus(''); await api.post(`/admin/v2/sections/${sectionId}/teachers`, { teacherUserIds: selectedIds }); setStatus('Teachers assigned'); load();
  };

  const teacherMap = useMemo(()=>Object.fromEntries(teachers.map(t=>[t.userid, t.name])),[teachers]);

  const openCsv = (sectionId)=>{ setCsvSectionId(sectionId); setCsvText('userId\n'); setCsvResult(null); setCsvOpen(true); };
  const closeCsv = ()=>{ setCsvOpen(false); };
  const submitCsv = async ()=>{
    if (!csvSectionId || !csvText.trim()) return;
    setStatus(''); setCsvResult(null);
    const r = await api.post(`/admin/v2/sections/${csvSectionId}/enrollments/csv`, { csvText });
    setCsvResult(r.data);
    load();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb:2 }}>Sections</Typography>
      {status && <Typography color="primary" sx={{ mb:1 }}>{status}</Typography>}
      <Paper sx={{ p:2, mb:2 }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={1} component="form" onSubmit={addSection}>
          <TextField size="small" select label="Course" value={form.courseId} onChange={e=>setForm(v=>({...v,courseId:e.target.value}))} sx={{ minWidth: 220 }}>
            {(courses||[]).map(c=> (<MenuItem key={c._id} value={c._id}>{c.name} ({c.code})</MenuItem>))}
          </TextField>
          <TextField size="small" label="Section Name" value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))} />
          <TextField size="small" label="Term" value={form.term} onChange={e=>setForm(v=>({...v,term:e.target.value}))} />
          <Button type="submit" variant="contained">Add</Button>
        </Stack>
      </Paper>

      <Paper>
        <List>
          {(sections||[]).map(s => (
            <ListItem key={s._id}
              secondaryAction={<IconButton edge="end" onClick={()=>removeSection(s._id)}><DeleteIcon /></IconButton>}>
              <ListItemText
                primary={`${s.name} • ${s.course?.name||''} (${s.course?.code||''})`}
                secondary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption">Teachers:</Typography>
                    {(s.teachers||[]).map(uid => (<Chip key={uid} size="small" label={teacherMap[uid]||uid} />))}
                    <TextField size="small" select value="" onChange={e=>assignTeachers(s._id, [...(s.teachers||[]), e.target.value])} sx={{ minWidth: 180 }}>
                      {(teachers||[]).filter(t=>!(s.teachers||[]).includes(t.userid)).map(t=> (
                        <MenuItem key={t.userid} value={t.userid}>{t.name} ({t.userid})</MenuItem>
                      ))}
                    </TextField>
                    <Button size="small" variant="outlined" onClick={()=>openCsv(s._id)}>Bulk Enroll (CSV)</Button>
                  </Stack>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={csvOpen} onClose={closeCsv} fullWidth maxWidth="sm">
        <DialogTitle>Bulk Enroll via CSV</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb:1 }}>Paste CSV with a header row containing <b>userId</b>. Example:</Typography>
          <TextField multiline minRows={8} fullWidth value={csvText} onChange={e=>setCsvText(e.target.value)} />
          {csvResult && (
            <Box sx={{ mt:2 }}>
              <Typography variant="subtitle2">Result: {csvResult.successCount} succeeded, {csvResult.failureCount} failed (total {csvResult.total})</Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto', mt:1 }}>
                {(csvResult.rows||[]).map((r,i)=> (
                  <Typography key={i} variant="caption">Row {r.rowNumber}: {r.userId} - {r.status}{r.reason?` (${r.reason})`:''}</Typography>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCsv}>Close</Button>
          <Button onClick={submitCsv} variant="contained">Upload</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
