import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, List, ListItem, ListItemText, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/client';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title:'', description:'', date:'', time:'', location:'', type:'event' });

  const load = async ()=>{ try{ const r=await api.get('/admin/v2/events', { params: { category:'college' } }); setEvents(r.data||[]);}catch{} };
  useEffect(()=>{ load(); },[]);

  const handleOpen = (ev=null)=>{
    if (ev) { setSelected(ev); setForm({ title: ev.title||'', description: ev.description||'', date: (ev.date||'').split('T')[0], time: ev.time||'', location: ev.location||'', type: ev.type||'event' }); }
    else { setSelected(null); setForm({ title:'', description:'', date:'', time:'', location:'', type:'event' }); }
    setOpen(true);
  };
  const handleClose = ()=>{ setOpen(false); setSelected(null); };

  const save = async (e)=>{
    e && e.preventDefault();
    if (!form.title || !form.date) return;
    const payload = { ...form, date: new Date(form.date).toISOString(), category: 'college' };
    if (selected) await api.patch(`/admin/v2/events/${selected._id}`, payload); else await api.post('/admin/v2/events', payload);
    handleClose();
    load();
  };

  const remove = async (id)=>{ await api.delete(`/admin/v2/events/${id}`); load(); };

  const ListBlock = ({ title, filterType }) => (
    <Paper sx={{ p:2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb:1 }}>
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={()=>handleOpen()}><AddIcon/></IconButton>
      </Stack>
      <List>
        {(events||[]).filter(e=> e.type===filterType).map((e)=> (
          <ListItem key={e._id}
            secondaryAction={
              <Box>
                <IconButton onClick={()=>handleOpen(e)}><EditIcon/></IconButton>
                <IconButton onClick={()=>remove(e._id)}><DeleteIcon/></IconButton>
              </Box>
            }>
            <ListItemText primary={e.title} secondary={`${new Date(e.date).toLocaleDateString()}${e.time? ' • '+e.time:''}${e.location? ' • '+e.location:''}`}/>
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ mb:2 }}>Events & Holidays</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}><ListBlock title="Events" filterType="event" /></Grid>
        <Grid item xs={12} md={6}><ListBlock title="Holidays" filterType="holiday" /></Grid>
      </Grid>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{selected? 'Edit Entry':'Add New Entry'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt:1 }}>
            <TextField label="Title" value={form.title} onChange={e=>setForm(v=>({ ...v, title:e.target.value }))} fullWidth required />
            <TextField label="Description" value={form.description} onChange={e=>setForm(v=>({ ...v, description:e.target.value }))} fullWidth multiline minRows={3} />
            <TextField label="Date" type="date" value={form.date} onChange={e=>setForm(v=>({ ...v, date:e.target.value }))} InputLabelProps={{ shrink:true }} fullWidth required />
            <TextField label="Time" type="time" value={form.time} onChange={e=>setForm(v=>({ ...v, time:e.target.value }))} InputLabelProps={{ shrink:true }} fullWidth />
            <TextField label="Location" value={form.location} onChange={e=>setForm(v=>({ ...v, location:e.target.value }))} fullWidth />
            <TextField label="Type" select value={form.type} onChange={e=>setForm(v=>({ ...v, type:e.target.value }))} fullWidth>
              <MenuItem value="event">Event</MenuItem>
              <MenuItem value="holiday">Holiday</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={save} variant="contained">{selected? 'Update':'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
