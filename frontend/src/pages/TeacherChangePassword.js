import React, { useState } from 'react';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import api from '../api/client';

export default function TeacherChangePassword() {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '' });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setStatus(''); setError('');
    try {
      await api.post('/auth/change-password', form);
      setStatus('Password changed');
      setForm({ oldPassword: '', newPassword: '' });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Change Password</Typography>
      <Paper sx={{ p:2 }}>
        <Stack component="form" spacing={2} onSubmit={submit}>
          <TextField label="Old Password" type="password" value={form.oldPassword} onChange={e=>setForm(v=>({...v, oldPassword:e.target.value}))} fullWidth required />
          <TextField label="New Password" type="password" value={form.newPassword} onChange={e=>setForm(v=>({...v, newPassword:e.target.value}))} fullWidth required />
          {status && <Typography color="primary">{status}</Typography>}
          {error && <Typography color="error">{error}</Typography>}
          <Button type="submit" variant="contained">Update</Button>
        </Stack>
      </Paper>
    </Box>
  );
}
