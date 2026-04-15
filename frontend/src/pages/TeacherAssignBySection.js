import React, { useEffect, useState } from 'react';
import { Box, Button, Grid, IconButton, Paper, Stack, TextField, Typography, MenuItem, Card, CardContent, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import api from '../api/client';

export default function TeacherAssignBySection() {
  const [sections, setSections] = useState([]);
  const [section, setSection] = useState(''); // sectionId
  const [assignments, setAssignments] = useState([]);
  const [editingId, setEditingId] = useState('');
  const [form, setForm] = useState({ title:'', dueDate:'', description:'' });
  const [status, setStatus] = useState('');

  const loadSections = async ()=>{ try{ const r=await api.get('/teacher/v2/sections'); setSections(r.data||[]);}catch(e){ setStatus('Failed to load sections'); } };
  const loadAssignments = async (id)=>{ try{ const r=await api.get(`/teacher/v2/sections/${encodeURIComponent(id)}/assignments`); setAssignments(r.data||[]);}catch{ setAssignments([]); } };

  useEffect(()=>{ loadSections(); },[]);
  useEffect(()=>{ if(section){ loadAssignments(section); setEditingId(''); setForm({ title:'', dueDate:'', description:'' }); } },[section]);

  const submit = async () => {
    if (!section) return;
    setStatus('Saving...');
    const payload = { 
      title: form.title, 
      details: form.description, 
      dueAt: form.dueDate || undefined,
      sectionId: section
    };
    
    try {
      if (editingId) {
        console.log('Updating assignment with:', { id: editingId, payload });
        // First try with the assignment ID as a string
        const assignmentId = typeof editingId === 'object' ? (editingId.$oid || editingId._id || editingId.id) : editingId;
        
        // Try the standard update endpoint first
        const response = await api.put(
          `/teacher/v2/assignments/${encodeURIComponent(assignmentId)}`,
          payload
        );
        console.log('Update response:', response);
        setStatus('Assignment updated');
      } else {
        console.log('Creating assignment with:', payload);
        const response = await api.post(
          `/teacher/v2/sections/${encodeURIComponent(section)}/assignments`,
          payload
        );
        console.log('Create response:', response);
        setStatus('Assignment created');
      }
      
      // Reset form and reload
      setForm({ title: '', dueDate: '', description: '' });
      setEditingId('');
      loadAssignments(section);
    } catch (e) {
      console.error('Save error details:', {
        message: e.message,
        response: e.response?.data,
        status: e.response?.status,
        config: {
          url: e.config?.url,
          method: e.config?.method,
          data: e.config?.data
        }
      });
      setStatus(e?.response?.data?.message || 'Failed to save. Please try again.');
    }
  };

  const onEdit = (asg)=>{
    setEditingId(asg._id);
    setForm({ title: asg.title || '', dueDate: (asg.dueAt||'').slice(0,10), description: asg.details || '' });
  };
  const onDelete = async (asg) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    
    setStatus('Deleting...');
    console.log('Full assignment object:', JSON.stringify(asg, null, 2));
    
    const assignmentId = asg._id?.$oid || asg._id || asg.id;
    if (!assignmentId) {
      console.error('No valid assignment ID found in:', asg);
      setStatus('Error: Could not find assignment ID');
      return;
    }
    
    try {
      console.log('Attempting to delete assignment with ID:', assignmentId);
      
      // Try the delete endpoint
      const response = await api.delete(
        `/teacher/v2/assignments/${encodeURIComponent(assignmentId)}`,
        { 
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      console.log('Delete successful:', response.data);
      setStatus('Assignment deleted');
      loadAssignments(section);
    } catch (error) {
      console.error('Delete error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      setStatus(error.response?.data?.message || 'Failed to delete assignment. Please try again.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', py: 6 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 4, borderRadius: 4, background: 'rgba(255,255,255,0.6)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d3a4a', mb: 4 }}>Assignments by Section</Typography>
        {status && <Typography color="primary" sx={{ mb: 2, p: 1, backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 2 }}>{status}</Typography>}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Section" value={section} onChange={e=>setSection(e.target.value)} sx={{ backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 2 }}>
              {(sections||[]).map(s=> (<MenuItem key={s._id} value={s._id}>{s.name}{typeof s.enrollmentCount==='number' ? ` (${s.enrollmentCount})` : ''}</MenuItem>))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={8}>
            <Stack direction={{ xs:'column', md:'row' }} spacing={2} sx={{ mb: 2 }}>
              <TextField label="Title" value={form.title} onChange={e=>setForm(v=>({...v,title:e.target.value}))} sx={{ backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 2 }} />
              <TextField label="Due Date" type="date" InputLabelProps={{ shrink:true }} value={form.dueDate} onChange={e=>setForm(v=>({...v,dueDate:e.target.value}))} sx={{ backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 2 }} />
            </Stack>
            <TextField multiline fullWidth sx={{ mb: 2, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 2 }} label="Description" value={form.description} onChange={e=>setForm(v=>({...v,description:e.target.value}))} />
            <Button variant="contained" onClick={submit} disabled={!section} sx={{ borderRadius: 2, fontWeight: 600 }}>{editingId ? 'Update Assignment' : 'Post to Section'}</Button>
          </Grid>
        </Grid>

        {section && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Assignments</Typography>
            {(!assignments || assignments.length===0) ? (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, background: 'rgba(255,255,255,0.7)' }}>
                <Typography color="text.secondary">No assignments yet.</Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {assignments.map(asg => (
                  <Card key={asg._id} sx={{ borderRadius: 3, background: 'rgba(255,255,255,0.7)', boxShadow: '0 4px 16px rgba(31, 38, 135, 0.1)', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(31, 38, 135, 0.15)' } }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3a4a', mb: 1 }}>{asg.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{asg.details}</Typography>
                        {asg.dueAt && (
                          <Chip label={`Due: ${String(asg.dueAt).slice(0,10)}`} size="small" color="primary" />
                        )}
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={()=>onEdit(asg)} sx={{ mr: 1 }}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={()=>onDelete(asg)}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
