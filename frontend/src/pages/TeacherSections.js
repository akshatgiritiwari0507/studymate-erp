import React, { useEffect, useState } from 'react';
import { Box, List, ListItem, ListItemText, Paper, Typography } from '@mui/material';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function TeacherSections() {
  const [sections, setSections] = useState([]);
  const [status, setStatus] = useState('');
  const nav = useNavigate();

  const load = async ()=>{
    try { const r = await api.get('/teacher/v2/sections'); setSections(r.data||[]); } catch {}
  };
  useEffect(()=>{ load(); },[]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb:2 }}>Sections</Typography>
      {status && <Typography color="primary" sx={{ mb:1 }}>{status}</Typography>}
      <Paper>
        <List>
          {(sections||[]).map(s=> (
            <ListItem key={s._id} button onClick={()=>nav(`/teacher/sections/${s._id}`)}>
              <ListItemText primary={s.name} secondary={`Enrolled: ${s.enrollmentCount ?? 0} • ${new Date(s.createdAt).toLocaleString?.()||''}`} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
