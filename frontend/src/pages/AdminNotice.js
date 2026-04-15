import React, { useEffect, useState } from 'react';
import { Box, Button, IconButton, List, ListItem, Card, CardContent, TextField, Typography, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/client';

export default function AdminNotice() {
  const [message, setMessage] = useState('');
  const [notices, setNotices] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async ()=>{ try{ const r=await api.get('/admin/v2/notices'); setNotices(r.data||[]);}catch{ setError('Failed to load notices'); } };
  useEffect(()=>{ load(); },[]);

  const add = async (e)=>{
    e && e.preventDefault(); if (!message.trim()) return; setError(''); setSuccess('');
    try{ await api.post('/admin/v2/notices', { message }); setMessage(''); setSuccess('Notice added'); load(); setTimeout(()=>setSuccess(''),1500);}catch{ setError('Failed to add notice'); }
  };
  const remove = async (id)=>{ setError(''); setSuccess(''); try{ await api.delete(`/admin/v2/notices/${id}`); setSuccess('Notice deleted'); load(); setTimeout(()=>setSuccess(''), 1500);}catch{ setError('Failed to delete'); } };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb:2 }}>Notices</Typography>
      {success && <Alert severity="success" sx={{ mb:1 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb:1 }}>{error}</Alert>}

      <form onSubmit={add}>
        <TextField fullWidth multiline minRows={2} label="New Notice" value={message} onChange={e=>setMessage(e.target.value)} sx={{ mb:2 }} />
        <Button type="submit" variant="contained">Add Notice</Button>
      </form>

      <Typography variant="h6" sx={{ mt:3, mb:1 }}>All Notices</Typography>
      <List>
        {(notices||[]).map(n => (
          <ListItem key={n._id} disablePadding>
            <Card sx={{ width: '100%', mb: 1, display: 'flex', alignItems: 'center' }}>
              <CardContent sx={{ flex: 1 }}>
                <Typography>{n.message}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(n.createdAt).toLocaleString()}</Typography>
              </CardContent>
              <IconButton onClick={()=>remove(n._id)} color="error"><DeleteIcon/></IconButton>
            </Card>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
