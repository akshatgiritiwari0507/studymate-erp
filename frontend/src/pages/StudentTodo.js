import React, { useEffect, useState } from 'react';
import { Box, Button, Checkbox, IconButton, List, ListItem, ListItemText, Paper, Stack, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/client';

export default function StudentTodo() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');

  const load = async ()=>{
    const r = await api.get('/student/me/todo');
    setItems(r.data||[]);
  };
  useEffect(()=>{ load(); },[]);

  const add = async (e)=>{
    e && e.preventDefault();
    if(!text) return;
    await api.post('/student/me/todo', { text, done: false });
    setText('');
    await load();
  };

  const toggle = async (id, done) => {
    await api.patch(`/student/me/todo/${id}`, { done: !done });
    await load();
  };

  const removeItem = async (id) => {
    await api.delete(`/student/me/todo/${id}`);
    await load();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>To-Do List</Typography>
      <Paper sx={{ p:2, mb:2, maxWidth: 600 }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={1} component="form" onSubmit={add}>
          <TextField size="small" fullWidth placeholder="Add a new task" value={text} onChange={e=>setText(e.target.value)} />
          <Button type="submit" variant="contained">Add</Button>
        </Stack>
      </Paper>
      <Box sx={{ maxWidth: 600 }}>
        {(items||[]).map((it)=> (
          <Paper key={it._id || it.id} sx={{ p:1.2, mb:1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Checkbox checked={!!it.done} onChange={()=>toggle(it._id || it.id, !!it.done)} />
                <Typography sx={{ textDecoration: it.done? 'line-through':'none' }}>{it.text}</Typography>
              </Stack>
              <IconButton onClick={()=>removeItem(it._id || it.id)} aria-label="delete"><DeleteIcon /></IconButton>
            </Stack>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
