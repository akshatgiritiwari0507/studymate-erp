import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Grid, Stack, TextField, Typography } from '@mui/material';
import api from '../api/client';
import TopBar from '../components/TopBar';

export default function Teacher() {
  const [students, setStudents] = useState([]);
  const [studentUserId, setStudentUserId] = useState('');
  const [selected, setSelected] = useState('');
  const [status, setStatus] = useState('');

  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [assignment, setAssignment] = useState({ title:'', subject:'', dueDate:'', description:'' });
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [attendance, setAttendance] = useState({ date:'', status:'present', subject:'' });
  const [notice, setNotice] = useState({ title:'', message:'' });

  const load = async () => {
    try {
      // Load students
      const studentsRes = await api.get('/teacher/students');
      setStudents(studentsRes.data || []);
      
      // Load sections
      const sectionsRes = await api.get('/teacher/v2/sections');
      setSections(sectionsRes.data || []);
      
      if (sectionsRes.data?.length > 0) {
        setSelectedSection(sectionsRes.data[0]._id);
        loadAssignments(sectionsRes.data[0]._id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setStatus('Error loading data');
    }
  };
  
  const loadAssignments = async (sectionId) => {
    try {
      const res = await api.get(`/teacher/v2/sections/${sectionId}/assignments`);
      setAssignments(res.data || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      setStatus('Error loading assignments');
    }
  };

  useEffect(() => { load(); }, []);

  const addStudent = async () => {
    setStatus('');
    await api.post('/teacher/students/add', { studentUserId });
    setStatus('Student added');
    setStudentUserId('');
    await load();
  };

  const removeStudent = async () => {
    setStatus('');
    await api.post('/teacher/students/remove', { studentUserId: selected });
    setStatus('Student removed');
    setSelected('');
    await load();
  };

  const postAssignment = async () => {
    setStatus('Saving...');
    try {
      if (editingAssignment) {
        console.log('Updating assignment with data:', {
          sectionId: selectedSection,
          assignmentId: editingAssignment._id,
          data: assignment
        });
        
        // Update existing assignment - use the section-specific endpoint
        const response = await api.put(
          `/teacher/v2/sections/${selectedSection}/assignments/${editingAssignment._id}`, 
          assignment
        );
        
        console.log('Update response:', response);
        setStatus('Assignment updated');
        setEditingAssignment(null);
      } else {
        console.log('Creating new assignment with data:', {
          sectionId: selectedSection,
          data: assignment
        });
        
        // Create new assignment
        const response = await api.post(
          `/teacher/v2/sections/${selectedSection}/assignments`, 
          assignment
        );
        
        console.log('Create response:', response);
        setStatus('Assignment created');
      }
      
      // Reset form and reload assignments
      setAssignment({ title: '', subject: '', dueDate: '', description: '' });
      loadAssignments(selectedSection);
    } catch (error) {
      console.error('Error saving assignment:', {
        message: error.message,
        url: error.config?.url,
        method: error.config?.method,
        requestData: error.config?.data,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Full error details:', error);
      setStatus(`Failed to save assignment: ${errorMessage}`);
    }
  };
  
  const editAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setAssignment({
      title: assignment.title || '',
      subject: assignment.subject || '',
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '',
      description: assignment.description || ''
    });
  };
  
  const deleteAssignment = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await api.delete(`/teacher/v2/assignments/${assignmentId}`);
        setStatus('Assignment deleted');
        loadAssignments(selectedSection);
      } catch (error) {
        console.error('Error deleting assignment:', error);
        setStatus('Failed to delete assignment');
      }
    }
  };

  const postAttendance = async () => {
    setStatus('');
    await api.post(`/teacher/students/${selected}/attendance`, attendance);
    setStatus('Attendance recorded');
  };

  const postNotice = async () => {
    setStatus('');
    await api.post(`/teacher/students/${selected}/notices`, notice);
    setStatus('Notice posted');
  };

  return (
    <>
      <TopBar />
      <Container sx={{ mt:3 }}>
        <Typography variant="h5" gutterBottom>Teacher Dashboard</Typography>
        {status && <Typography color="primary" sx={{ mb:2 }}>{status}</Typography>}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6">Mapped Students</Typography>
            <pre style={{ background:'#f7f7f7ff', padding:12, maxHeight:240, overflow:'auto' }}>{JSON.stringify(students, null, 2)}</pre>
            <Stack direction="row" spacing={1} sx={{ mb:2 }}>
              <TextField size="small" label="Student UserID" value={studentUserId} onChange={e=>setStudentUserId(e.target.value)} />
              <Button variant="contained" onClick={addStudent}>Add</Button>
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField size="small" label="Select UserID" value={selected} onChange={e=>setSelected(e.target.value)} />
              <Button color="error" variant="outlined" onClick={removeStudent} disabled={!selected}>Remove</Button>
            </Stack>
          </Grid>

          <Grid item xs={12} md={8}>
            <Box sx={{ mb:3 }}>
              <Typography variant="h6">{editingAssignment ? 'Edit' : 'Create'} Assignment</Typography>
              {sections.length > 0 && (
                <TextField
                  select
                  label="Section"
                  value={selectedSection}
                  onChange={e => {
                    setSelectedSection(e.target.value);
                    loadAssignments(e.target.value);
                  }}
                  fullWidth
                  margin="normal"
                  SelectProps={{
                    native: true,
                  }}
                >
                  {sections.map((section) => (
                    <option key={section._id} value={section._id}>
                      {section.name}
                    </option>
                  ))}
                </TextField>
              )}
              <Stack direction={{ xs:'column', md:'row' }} spacing={2} sx={{ mt: 1 }}>
                <TextField 
                  label="Title" 
                  fullWidth 
                  value={assignment.title} 
                  onChange={e => setAssignment(v => ({...v, title: e.target.value}))} 
                />
                <TextField 
                  label="Subject" 
                  fullWidth 
                  value={assignment.subject} 
                  onChange={e => setAssignment(v => ({...v, subject: e.target.value}))} 
                />
              </Stack>
              <Stack direction={{ xs:'column', md:'row' }} spacing={2} sx={{ mt: 1 }}>
                <TextField 
                  label="Due Date" 
                  type="date"
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                  value={assignment.dueDate} 
                  onChange={e => setAssignment(v => ({...v, dueDate: e.target.value}))} 
                />
              </Stack>
              <TextField 
                multiline 
                fullWidth 
                sx={{ mt: 1 }} 
                label="Description" 
                rows={4}
                value={assignment.description} 
                onChange={e => setAssignment(v => ({...v, description: e.target.value}))} 
              />
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Button 
                  variant="contained" 
                  onClick={postAssignment}
                  disabled={!assignment.title || !assignment.subject || !assignment.dueDate}
                >
                  {editingAssignment ? 'Update' : 'Create'} Assignment
                </Button>
                {editingAssignment && (
                  <Button 
                    variant="outlined" 
                    onClick={() => {
                      setEditingAssignment(null);
                      setAssignment({ title: '', subject: '', dueDate: '', description: '' });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </Stack>
              
              {/* Assignments List */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Assignments</Typography>
                {assignments.length === 0 ? (
                  <Typography>No assignments found</Typography>
                ) : (
                  <div>
                    {assignments.map((assgn) => (
                      <Paper key={assgn._id} sx={{ p: 2, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Typography variant="subtitle1">{assgn.title}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {assgn.subject} • Due: {new Date(assgn.dueDate).toLocaleDateString()}
                          </Typography>
                        </div>
                        <div>
                          <Button 
                            size="small" 
                            onClick={() => editAssignment(assgn)}
                            sx={{ mr: 1 }}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="small" 
                            color="error"
                            onClick={() => deleteAssignment(assgn._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </Paper>
                    ))}
                  </div>
                )}
              </Box>
            </Box>

            <Box sx={{ mb:3 }}>
              <Typography variant="h6">Mark Attendance</Typography>
              <Stack direction={{ xs:'column', md:'row' }} spacing={2}>
                <TextField label="Date" value={attendance.date} onChange={e=>setAttendance(v=>({...v,date:e.target.value}))} />
                <TextField label="Status (present/absent)" value={attendance.status} onChange={e=>setAttendance(v=>({...v,status:e.target.value}))} />
                <TextField label="Subject" value={attendance.subject} onChange={e=>setAttendance(v=>({...v,subject:e.target.value}))} />
              </Stack>
              <Button sx={{ mt:1 }} variant="contained" onClick={postAttendance} disabled={!selected}>Record</Button>
            </Box>

            <Box>
              <Typography variant="h6">Post Notice</Typography>
              <Stack direction={{ xs:'column', md:'row' }} spacing={2}>
                <TextField label="Title" value={notice.title} onChange={e=>setNotice(v=>({...v,title:e.target.value}))} />
                <TextField label="Message" value={notice.message} onChange={e=>setNotice(v=>({...v,message:e.target.value}))} />
              </Stack>
              <Button sx={{ mt:1 }} variant="contained" onClick={postNotice} disabled={!selected}>Post</Button>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
