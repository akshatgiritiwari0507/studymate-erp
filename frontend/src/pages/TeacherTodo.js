import React, { useEffect, useState } from 'react';
import { Box, Button, Card, Checkbox, IconButton, List, ListItem, ListItemText, Stack, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/client';

export default function TeacherTodo(){
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');

  const load = async ()=>{
    try{
      const r = await api.get('/teacher/me/todo');
      setItems(Array.isArray(r.data)? r.data : []);
    }catch{}
  };
  useEffect(()=>{ load(); },[]);

  const addItem = async (e)=>{
    e && e.preventDefault();
    if (!text.trim()) return;
    await api.post('/teacher/me/todo', { text, done: false });
    setText('');
    await load();
  };

  const toggle = async (id, done)=>{
    await api.patch(`/teacher/me/todo/${id}`, { done: !done });
    await load();
  };

  const removeItem = async (id)=>{
    await api.delete(`/teacher/me/todo/${id}`);
    await load();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb:2 }}>To-Do</Typography>
      <Stack direction={{ xs:'column', sm:'row' }} spacing={1} sx={{ mb:2 }} component="form" onSubmit={addItem}>
        <TextField size="small" fullWidth placeholder="Add a task" value={text} onChange={e=>setText(e.target.value)} />
        <Button type="submit" variant="contained">Add</Button>
      </Stack>
      <Card>
        <List>
          {items.map(item => (
            <ListItem key={item._id || item.id} secondaryAction={<IconButton edge="end" onClick={()=>removeItem(item._id || item.id)}><DeleteIcon /></IconButton>}>
              <Checkbox checked={!!item.done} onChange={()=>toggle(item._id || item.id, !!item.done)} />
              <ListItemText primary={item.text} secondary={item.done ? 'Done' : 'Pending'} />
            </ListItem>
          ))}
          {items.length===0 && <ListItem><ListItemText primary="No tasks" /></ListItem>}
        </List>
      </Card>
    </Box>
  );
}
