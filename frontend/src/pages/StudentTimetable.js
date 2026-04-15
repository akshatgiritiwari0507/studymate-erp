import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import api from '../api/client';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TIME_SLOTS = [
  '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 1:00 PM',
  '2:00 PM - 3:00 PM',
  '3:00 PM - 4:00 PM',
  '4:00 PM - 5:00 PM'
];

export default function StudentTimetable() {
  const [timetable, setTimetable] = useState({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ day:'', timeSlot:'', subject:'', room:'' });

  const fetchTimetable = async ()=>{
    try{
      const r = await api.get('/api/timetable');
      const map = {};
      (r.data||[]).forEach(e=>{ map[`${e.day}-${e.timeSlot}`] = { subject: e.subject, room: e.room }; });
      setTimetable(map);
    }catch(e){ /* ignore */ }
  };

  useEffect(()=>{ fetchTimetable(); },[]);

  const handleOpen = ()=> setOpen(true);
  const handleClose = ()=>{ setOpen(false); setForm({ day:'', timeSlot:'', subject:'', room:'' }); };

  const handleSubmit = async (e)=>{
    e.preventDefault();
    if (!form.day || !form.timeSlot || !form.subject || !form.room) return;
    await api.post('/api/timetable', { day: form.day, timeSlot: form.timeSlot, subject: form.subject, room: form.room });
    setTimetable(prev=> ({ ...prev, [`${form.day}-${form.timeSlot}`]: { subject: form.subject, room: form.room } }));
    handleClose();
  };

  const handleClear = async ()=>{
    await api.delete('/api/timetable');
    setTimetable({});
  };

  const getCellContent = (day, timeSlot) => {
    const entry = timetable[`${day}-${timeSlot}`];
    if (!entry) return '';
    return (
      <Box>
        <Typography variant="body2">{entry.subject}</Typography>
        <Typography variant="caption" color="text.secondary">({entry.room})</Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
        <Typography variant="h4">Timetable</Typography>
        <Box sx={{ display:'flex', gap:2 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>Add Class</Button>
          <Button variant="outlined" color="error" onClick={handleClear}>Clear Timetable</Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              {DAYS.map(day => (<TableCell key={day}>{day}</TableCell>))}
            </TableRow>
          </TableHead>
          <TableBody>
            {TIME_SLOTS.map(slot => (
              <TableRow key={slot}>
                <TableCell>{slot}</TableCell>
                {DAYS.map(day => (
                  <TableCell key={`${day}-${slot}`}>{getCellContent(day, slot)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Class</DialogTitle>
        <DialogContent>
          <TextField select fullWidth margin="dense" label="Day" value={form.day}
            onChange={e=>setForm({ ...form, day: e.target.value })} required>
            {DAYS.map(day => (<MenuItem key={day} value={day}>{day}</MenuItem>))}
          </TextField>
          <TextField select fullWidth margin="dense" label="Time Slot" value={form.timeSlot}
            onChange={e=>setForm({ ...form, timeSlot: e.target.value })} required>
            {TIME_SLOTS.map(s => (<MenuItem key={s} value={s}>{s}</MenuItem>))}
          </TextField>
          <TextField fullWidth margin="dense" label="Subject" value={form.subject}
            onChange={e=>setForm({ ...form, subject: e.target.value })} required />
          <TextField fullWidth margin="dense" label="Room" value={form.room}
            onChange={e=>setForm({ ...form, room: e.target.value })} required />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!form.day || !form.timeSlot || !form.subject || !form.room}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
