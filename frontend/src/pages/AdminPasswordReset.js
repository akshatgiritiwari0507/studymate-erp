import React, { useState } from 'react';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import api from '../api/client';

export default function AdminPasswordReset() {
  const [userid, setUserid] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const reset = async () => {
    if (!userid) return;
    setStatus(''); setError('');
    try {
      await api.post(`/admin/users/${encodeURIComponent(userid)}/reset-password`);
      setStatus('Password reset to userid');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to reset');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb:2 }}>Password Reset</Typography>
      <Paper sx={{ p:2 }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={1} alignItems="center">
          <TextField size="small" label="UserID" value={userid} onChange={e=>setUserid(e.target.value)} />
          <Button variant="contained" onClick={reset}>Reset</Button>
        </Stack>
        {status && <Typography sx={{ mt:1 }} color="primary">{status}</Typography>}
        {error && <Typography sx={{ mt:1 }} color="error">{error}</Typography>}
      </Paper>
    </Box>
  );
}
