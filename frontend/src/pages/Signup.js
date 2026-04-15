import React, { useEffect, useState } from 'react';
import { Button, Container, MenuItem, Stack, TextField, Typography, Grid, Box, Paper, Avatar } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import SchoolIcon from '@mui/icons-material/School';

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ userid: '', password: '', courseId: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);

  useEffect(()=>{
    (async ()=>{ try{ const r=await api.get('/auth/courses'); setCourses(r.data||[]); }catch{} })();
  },[]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      await signup(form.userid, form.password, form.courseId || undefined);
      setMsg('Signup successful. Please login.');
      setTimeout(()=>nav('/login'), 800);
    } catch (err) {
      setError(err?.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#f1f5ff,#ffffff)' }}>
      <Grid container spacing={4} sx={{ maxWidth: 1000, mx: 'auto', px: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            <Typography variant="h5" fontWeight={700} gutterBottom>Create Account</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Join StudyMate to get started.</Typography>
            <Stack component="form" spacing={2} onSubmit={onSubmit}>
              <TextField label="User ID" value={form.userid} onChange={(e)=>setForm(v=>({...v, userid:e.target.value}))} required fullWidth />
              <TextField label="Password" type="password" value={form.password} onChange={(e)=>setForm(v=>({...v, password:e.target.value}))} required fullWidth />
              <TextField select label="Course (optional)" value={form.courseId} onChange={(e)=>setForm(v=>({...v, courseId:e.target.value}))} helperText="Select if signing up as a student" fullWidth>
                {courses.map((c)=>(
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
              <Button type="submit" variant="contained" fullWidth>Sign Up</Button>
              {msg && <Typography color="success.main" sx={{ mt: 1 }}>{msg}</Typography>}
              {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
              <Typography textAlign="center" variant="body2">
                Already have an account? <Link to="/login">Login</Link>
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
