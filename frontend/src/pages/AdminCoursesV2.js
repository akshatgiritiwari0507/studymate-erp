import React, { useEffect, useState } from 'react';
import { Box, Button, IconButton, List, ListItem, ListItemText, Paper, Stack, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/client';

export default function AdminCoursesV2(){
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ name:'', code:'', department:'', year:'' });
  const [status, setStatus] = useState('');

  const load = async ()=>{
    try{ const r = await api.get('/admin/v2/courses'); setCourses(r.data||[]); }catch{}
  };
  useEffect(()=>{ load(); },[]);

  const add = async (e)=>{
    e && e.preventDefault(); setStatus('');
    if (!form.name || !form.code) return;
    await api.post('/admin/v2/courses', form);
    setForm({ name:'', code:'', department:'', year:'' });
    setStatus('Course created'); load();
  };

  const removeCourse = async (id)=>{
    setStatus('');
    const r = await api.delete(`/admin/v2/courses/${id}`).catch(err=>({ data: { message: err?.response?.data?.message||'Delete failed' } }));
    setStatus(r.data?.message || 'Deleted'); load();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb:2 }}>Courses</Typography>
      {status && <Typography color="primary" sx={{ mb:1 }}>{status}</Typography>}

      <Paper sx={{ p:2, mb:2 }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={1} component="form" onSubmit={add}>
          <TextField size="small" label="Name" value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))} />
          <TextField size="small" label="Code" value={form.code} onChange={e=>setForm(v=>({...v,code:e.target.value}))} />
          <TextField size="small" label="Department" value={form.department} onChange={e=>setForm(v=>({...v,department:e.target.value}))} />
          <TextField size="small" label="Year" value={form.year} onChange={e=>setForm(v=>({...v,year:e.target.value}))} />
          <Button type="submit" variant="contained">Add</Button>
        </Stack>
      </Paper>

      <Paper>
        <List>
          {(courses||[]).map(c => (
            <ListItem key={c._id}
              secondaryAction={<IconButton edge="end" onClick={()=>removeCourse(c._id)}><DeleteIcon /></IconButton>}>
              <ListItemText primary={`${c.name} (${c.code})`} secondary={[c.department,c.year].filter(Boolean).join(' • ')} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
