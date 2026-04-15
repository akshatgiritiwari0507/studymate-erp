import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, IconButton, List, ListItem, ListItemText, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/client';

export default function AdminBus() {
  const [routes, setRoutes] = useState([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ busNumber:'', shift:'morning', departureTime:'', stops:[{ stopName:'', arrivalTime:'' }] });

  const load = async ()=>{ try{ const r=await api.get('/admin/v2/bus-routes'); setRoutes(r.data||[]);}catch{} };
  useEffect(()=>{ load(); },[]);

  const handleOpen = (route=null)=>{
    if(route){ setSelected(route); setForm({ busNumber: route.busNumber||'', shift: route.shift||'morning', departureTime: route.departureTime||'', stops:(route.stops||[]).map(s=>({ stopName:s.stopName||'', arrivalTime:s.arrivalTime||'' })) }); }
    else { setSelected(null); setForm({ busNumber:'', shift:'morning', departureTime:'', stops:[{ stopName:'', arrivalTime:'' }] }); }
    setOpen(true);
  };
  const handleClose = ()=>{ setOpen(false); setSelected(null); };

  const addStop = ()=> setForm(f=>({ ...f, stops:[...f.stops, { stopName:'', arrivalTime:'' }] }));
  const removeStop = (i)=> setForm(f=>({ ...f, stops: f.stops.filter((_,idx)=>idx!==i) }));
  const setStop = (i, field, value)=> setForm(f=>({ ...f, stops: f.stops.map((s,idx)=> idx!==i? s : { ...s, [field]: value }) }));

  const save = async (e)=>{
    e && e.preventDefault();
    const payload = { ...form, stops: form.stops.map(s=>({ stopName: s.stopName.trim(), arrivalTime: s.arrivalTime })) };
    if (selected) await api.patch(`/admin/v2/bus-routes/${selected._id}`, payload);
    else await api.post('/admin/v2/bus-routes', payload);
    handleClose();
    load();
  };

  const remove = async (id)=>{ await api.delete(`/admin/v2/bus-routes/${id}`); load(); };

  const byShift = (shift)=> (routes||[]).filter(r=>r.shift===shift);

  const ListBlock = ({ title, items }) => (
    <Paper sx={{ p:2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb:1 }}>
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={()=>handleOpen()}><AddIcon/></IconButton>
      </Stack>
      <List>
        {items.map((r)=> (
          <ListItem key={r._id}
            secondaryAction={
              <Box>
                <IconButton onClick={()=>handleOpen(r)}><EditIcon/></IconButton>
                <IconButton onClick={()=>remove(r._id)}><DeleteIcon/></IconButton>
              </Box>
            }>
            <ListItemText primary={`Bus ${r.busNumber}`} secondary={`${(r.stops||[]).length} stops | Departure: ${r.departureTime}`} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ mb:2 }}>Campus Bus</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}><ListBlock title="1st Shift Routes" items={byShift('morning')} /></Grid>
        <Grid item xs={12} md={6}><ListBlock title="2nd Shift Routes" items={byShift('afternoon')} /></Grid>
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{selected? 'Edit Route':'Add New Route'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={save} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Bus Number" value={form.busNumber} onChange={e=>setForm(v=>({ ...v, busNumber:e.target.value }))} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Shift" value={form.shift} onChange={e=>setForm(v=>({ ...v, shift:e.target.value }))} required>
                  <MenuItem value="morning">1st Shift</MenuItem>
                  <MenuItem value="afternoon">2nd Shift</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Bus Stops</Typography>
                {form.stops.map((s, idx)=> (
                  <Grid container spacing={2} alignItems="center" key={idx} sx={{ mb:1 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Stop Name" value={s.stopName} onChange={e=>setStop(idx,'stopName',e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth label="Arrival Time" type="time" value={s.arrivalTime} onChange={e=>setStop(idx,'arrivalTime',e.target.value)} InputLabelProps={{ shrink:true }} required />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Button color="error" onClick={()=>removeStop(idx)} disabled={form.stops.length===1}>Remove</Button>
                    </Grid>
                  </Grid>
                ))}
                <Button onClick={addStop} startIcon={<AddIcon/>}>Add Stop</Button>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Departure (bus leaves college)" type="time" value={form.departureTime} onChange={e=>setForm(v=>({ ...v, departureTime:e.target.value }))} InputLabelProps={{ shrink:true }} required />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={save} variant="contained">{selected?'Update':'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
