import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import api from '../api/client';

export default function TeacherAbout() {
  const [form, setForm] = useState({ fullName: '', mobile: '', address: '' });
  const [status, setStatus] = useState('');

  useEffect(()=>{
    (async()=>{
      try { const r = await api.get('/teacher/me/profile'); setForm({ fullName: r.data.fullName||'', mobile: r.data.mobile||'', address: r.data.address||'' }); } catch {}
    })();
  },[]);

  const save = async (e) => {
    e.preventDefault(); setStatus('');
    await api.post('/teacher/me/profile', form);
    setStatus('Profile saved');
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>About</Typography>
      <Paper sx={{ p:2 }}>
        <Stack component="form" spacing={2} onSubmit={save}>
          <TextField label="Full Name" value={form.fullName} onChange={e=>setForm(v=>({...v, fullName:e.target.value}))} fullWidth />
          <TextField label="Mobile" value={form.mobile} onChange={e=>setForm(v=>({...v, mobile:e.target.value}))} fullWidth />
          <TextField label="Address" value={form.address} onChange={e=>setForm(v=>({...v, address:e.target.value}))} fullWidth multiline minRows={2} />
          {status && <Typography color="primary">{status}</Typography>}
          <Button type="submit" variant="contained">Save</Button>
        </Stack>
      </Paper>
    </Box>
  );
}
