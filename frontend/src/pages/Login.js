import React, { useState } from 'react';
import { Box, Button, Paper, Stack, TextField, Typography, Grid, Avatar } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ userid: '', password: '' });
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login(form.userid, form.password);
      if (res.role === 'admin') nav('/admin');
      else if (res.role === 'teacher') nav('/teacher');
      else nav('/student');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#f1f5ff,#ffffff)' }}>
      <Grid container spacing={4} sx={{ maxWidth: 1000, mx: 'auto', px: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>StudyMate Login</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Welcome back. Please sign in to continue.</Typography>
            <Stack component="form" spacing={2} onSubmit={onSubmit}>
              <TextField label="User ID" value={form.userid} onChange={(e)=>setForm(v=>({...v, userid:e.target.value}))} required fullWidth />
              <TextField label="Password" type="password" value={form.password} onChange={(e)=>setForm(v=>({...v, password:e.target.value}))} required fullWidth />
              {error && <Typography color="error">{error}</Typography>}
              <Button type="submit" variant="contained" fullWidth>Login</Button>
              <Typography textAlign="center" variant="body2">
                Don't have an account? <Link to="/signup">Sign up</Link>
              </Typography>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Avatar sx={{ width: 120, height: 120, mx: 'auto', mb: 3, bgcolor: 'primary.main', boxShadow: '0 8px 32px rgba(63, 81, 181, 0.3)' }}>
              <SchoolIcon sx={{ fontSize: 60 }} />
            </Avatar>
            <Typography variant="h3" fontWeight={700} color="primary.main" sx={{ mb: 2 }}>StudyMate</Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>Your Complete School Management Solution</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
              Streamline education with modern tools for students, teachers, and administrators.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
