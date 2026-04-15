import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, Card, List, ListItem, ListItemText, Stack, TextField, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api/client';

export default function TeacherSectionDetail(){
  const { id } = useParams();
  const [section, setSection] = useState({ name: '' });
  const [members, setMembers] = useState([]);
  const [studentUserId, setStudentUserId] = useState('');
  const [status, setStatus] = useState('');

  const load = async ()=>{
    try{
      const r1 = await api.get(`/teacher/v2/sections/${id}`);
      setSection(r1.data || { name: '' });
      const r2 = await api.get(`/teacher/v2/sections/${id}/enrollments`);
      setMembers(Array.isArray(r2.data)? r2.data : []);
    }catch{}
  };

  useEffect(()=>{ load(); /* eslint-disable-next-line */ },[id]);

  const addMember = async (e)=>{
    e && e.preventDefault(); setStatus('');
    if (!studentUserId) return;
    await api.post(`/teacher/v2/sections/${id}/enrollments`, { studentUserIds: [studentUserId] });
    setStudentUserId(''); setStatus('Student added'); load();
  };

  const removeMember = async (uid)=>{
    setStatus('');
    await api.delete(`/teacher/v2/sections/${id}/enrollments/${uid}`);
    setStatus('Student removed'); load();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb:2 }}>{section.name}</Typography>
      {status && <Typography color="primary" sx={{ mb:1 }}>{status}</Typography>}

      <Card sx={{ p:2, mb:2 }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={1} component="form" onSubmit={addMember}>
          <TextField size="small" label="Student User ID" value={studentUserId} onChange={e=>setStudentUserId(e.target.value)} />
          <Button type="submit" variant="contained">Add Student</Button>
        </Stack>
      </Card>

      <Card>
        <List>
          {(members||[]).map(m => (
            <ListItem key={m.studentUserId}
              secondaryAction={<IconButton edge="end" onClick={()=>removeMember(m.studentUserId)}><DeleteIcon /></IconButton>}>
              <ListItemText primary={m.name} secondary={m.studentUserId} />
            </ListItem>
          ))}
          {(!members || members.length===0) && (
            <ListItem><ListItemText primary="No students yet" /></ListItem>
          )}
        </List>
      </Card>
    </Box>
  );
}
