import React, { useState } from 'react';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import api from '../api/client';

export default function AdminTeacherAccounts(){
  const [createForm, setCreateForm] = useState({ userid:'', password:'' });
  const [deleteId, setDeleteId] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const createTeacher = async (e)=>{
    e && e.preventDefault(); setStatus(''); setError('');
    if (!createForm.userid || !createForm.password) { setError('userid and password required'); return; }
    try{
      await api.post('/admin/v2/teachers', createForm);
      setStatus('Teacher created');
      setCreateForm({ userid:'', password:'' });
    }catch(err){ setError(err?.response?.data?.message || 'Failed to create'); }
  };

  const deleteTeacher = async ()=>{
    setStatus(''); setError('');
    if (!deleteId) { setError('userid required'); return; }
    try{
      await api.delete(`/admin/v2/teachers/${encodeURIComponent(deleteId)}`);
      setStatus('Teacher deleted');
      setDeleteId('');
    }catch(err){ setError(err?.response?.data?.message || 'Failed to delete'); }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb:2 }}>Teacher Accounts</Typography>
      {status && <Typography color="primary" sx={{ mb:1 }}>{status}</Typography>}
      {error && <Typography color="error" sx={{ mb:1 }}>{error}</Typography>}

      <Paper sx={{ p:2, mb:2 }}>
        <Typography variant="h6" sx={{ mb:1 }}>Create Teacher</Typography>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={1} component="form" onSubmit={createTeacher}>
          <TextField size="small" label="UserID" value={createForm.userid} onChange={e=>setCreateForm(v=>({...v, userid:e.target.value}))} />
          <TextField size="small" label="Password" type="password" value={createForm.password} onChange={e=>setCreateForm(v=>({...v, password:e.target.value}))} />
          <Button type="submit" variant="contained">Create</Button>
        </Stack>
      </Paper>

      <Paper sx={{ p:2 }}>
        <Typography variant="h6" sx={{ mb:1 }}>Delete Teacher</Typography>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={1}>
          <TextField size="small" label="UserID" value={deleteId} onChange={e=>setDeleteId(e.target.value)} />
          <Button color="error" variant="outlined" onClick={deleteTeacher}>Delete</Button>
        </Stack>
      </Paper>
    </Box>
  );
}
