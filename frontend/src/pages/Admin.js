import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Divider, Stack, TextField, Typography } from '@mui/material';
import api from '../api/client';
import TopBar from '../components/TopBar';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [targetUser, setTargetUser] = useState('');
  const [role, setRole] = useState('teacher');
  const [campus, setCampus] = useState({ campusEvents: [], holidays: [] });
  const [status, setStatus] = useState('');

  const loadUsers = async () => {
    const res = await api.get('/admin/users');
    setUsers(res.data || []);
  };

  const loadCampus = async () => {
    const res = await api.get('/admin/campus-info');
    setCampus(res.data || { campusEvents: [], holidays: [] });
  };

  useEffect(() => { loadUsers(); loadCampus(); }, []);

  const updateRole = async () => {
    setStatus('');
    await api.post(`/admin/users/${targetUser}/role`, { role });
    setStatus('Role updated');
    await loadUsers();
  };

  const saveCampus = async () => {
    setStatus('');
    // Clean up temporary fields before sending
    const cleanData = {
      campusEvents: campus.campusEvents || [],
      holidays: campus.holidays || [],
      notices: campus.notices || [],
      busRoutes: campus.busRoutes || []
    };
    console.log('Admin save - original campus state:', JSON.stringify(campus, null, 2));
    console.log('Admin save - clean data to send:', JSON.stringify(cleanData, null, 2));
    try {
      const response = await api.post('/admin/campus-info', cleanData);
      console.log('Admin save - server response:', JSON.stringify(response.data, null, 2));
      setStatus('Campus info saved');
      // Reload to verify
      await loadCampus();
    } catch (error) {
      console.error('Admin save error:', error);
      setStatus('Error saving campus info');
    }
  };

  return (
    <>
      <TopBar />
      <Container sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom>Admin Dashboard</Typography>
        {status && <Typography color="primary" sx={{ mb:2 }}>{status}</Typography>}

        <Stack direction={{ xs:'column', md:'row' }} spacing={4}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">Users</Typography>
            <pre style={{ background:'#f7f7f7', padding:12, maxHeight:300, overflow:'auto' }}>{JSON.stringify(users, null, 2)}</pre>
            <Stack direction={{ xs:'column', sm:'row' }} spacing={2} alignItems="center">
              <TextField label="UserID" size="small" value={targetUser} onChange={e=>setTargetUser(e.target.value)} />
              <TextField label="Role (admin/teacher/student)" size="small" value={role} onChange={e=>setRole(e.target.value)} />
              <Button variant="contained" onClick={updateRole}>Set Role</Button>
            </Stack>
          </Box>

          <Divider orientation="vertical" flexItem />

          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">Campus Info</Typography>
            
            {/* Events Section */}
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Events</Typography>
            {campus.campusEvents?.map((event, i) => (
              <Box key={i} sx={{ p: 2, mb: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography variant="body2"><strong>{event.title}</strong> - {event.date}</Typography>
                <Typography variant="caption">{event.description}</Typography>
              </Box>
            ))}
            <Box sx={{ p: 2, mb: 2, border: '1px solid #ccc', borderRadius: 1, bgcolor: '#f9f9f9' }}>
              <Typography variant="subtitle2">Add Event</Typography>
              <Stack spacing={1}>
                <TextField size="small" placeholder="Title" value={campus.newEventTitle || ''} onChange={e => setCampus({...campus, newEventTitle: e.target.value})} />
                <TextField size="small" placeholder="Date" value={campus.newEventDate || ''} onChange={e => setCampus({...campus, newEventDate: e.target.value})} />
                <TextField size="small" placeholder="Description" value={campus.newEventDescription || ''} onChange={e => setCampus({...campus, newEventDescription: e.target.value})} />
                <Button size="small" onClick={() => {
                  if (campus.newEventTitle && campus.newEventDate) {
                    setCampus({
                      ...campus,
                      campusEvents: [...(campus.campusEvents || []), {
                        title: campus.newEventTitle,
                        date: campus.newEventDate,
                        description: campus.newEventDescription || ''
                      }],
                      newEventTitle: '',
                      newEventDate: '',
                      newEventDescription: ''
                    });
                  }
                }}>Add Event</Button>
              </Stack>
            </Box>

            {/* Holidays Section */}
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Holidays</Typography>
            {campus.holidays?.map((holiday, i) => (
              <Box key={i} sx={{ p: 2, mb: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography variant="body2"><strong>{holiday.title}</strong> - {holiday.date}</Typography>
                <Typography variant="caption">{holiday.description}</Typography>
              </Box>
            ))}
            <Box sx={{ p: 2, mb: 2, border: '1px solid #ccc', borderRadius: 1, bgcolor: '#f9f9f9' }}>
              <Typography variant="subtitle2">Add Holiday</Typography>
              <Stack spacing={1}>
                <TextField size="small" placeholder="Title" value={campus.newHolidayTitle || ''} onChange={e => setCampus({...campus, newHolidayTitle: e.target.value})} />
                <TextField size="small" placeholder="Date" value={campus.newHolidayDate || ''} onChange={e => setCampus({...campus, newHolidayDate: e.target.value})} />
                <TextField size="small" placeholder="Description" value={campus.newHolidayDescription || ''} onChange={e => setCampus({...campus, newHolidayDescription: e.target.value})} />
                <Button size="small" onClick={() => {
                  if (campus.newHolidayTitle && campus.newHolidayDate) {
                    setCampus({
                      ...campus,
                      holidays: [...(campus.holidays || []), {
                        title: campus.newHolidayTitle,
                        date: campus.newHolidayDate,
                        description: campus.newHolidayDescription || ''
                      }],
                      newHolidayTitle: '',
                      newHolidayDate: '',
                      newHolidayDescription: ''
                    });
                  }
                }}>Add Holiday</Button>
              </Stack>
            </Box>

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button variant="contained" onClick={saveCampus}>Save All</Button>
              <Button onClick={loadCampus}>Reload</Button>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </>
  );
}
