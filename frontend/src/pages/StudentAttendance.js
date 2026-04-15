import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  TextField,
  Button,
  Grid,
  Paper,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import { CheckCircle, Cancel, Search, Person as PersonIcon } from '@mui/icons-material';
import api from '../api/client';

// Helper function to group attendance by teacher
const groupByTeacher = (attendance) => {
  return attendance.reduce((acc, record) => {
    const teacherId = record.takenBy || 'unknown';
    if (!acc[teacherId]) {
      acc[teacherId] = {
        teacherId,
        teacherName: record.takenByName || 'Unknown Teacher',
        records: []
      };
    }
    acc[teacherId].records.push(record);
    return acc;
  }, {});
};

export default function StudentAttendance() {
  const theme = useTheme();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teachers, setTeachers] = useState([]);

  // Function to safely fetch data with error handling
  const safeApiCall = async (url, options = {}) => {
    try {
      const response = await api.get(url, options);
      return response;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  };

  // Fetch attendance data and teachers
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch attendance data
      const [attendanceRes, teachersRes] = await Promise.all([
        safeApiCall('/student/v2/attendance'),
        safeApiCall('/student/v2/teachers')
      ]);
      
      if (!attendanceRes.data) {
        throw new Error('No attendance data received');
      }

      const attendanceData = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
      setAttendance(attendanceData);
      
      // Process teachers
      const teachersData = Array.isArray(teachersRes.data) ? teachersRes.data : [];
      setTeachers(teachersData);
      
      // If no teacher is selected, select the first one
      if (teachersData.length > 0 && !selectedTeacher) {
        setSelectedTeacher(teachersData[0].userid);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError(error.message || 'Failed to load data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group attendance by teacher
  const attendanceByTeacher = useMemo(() => {
    return groupByTeacher(attendance);
  }, [attendance]);

  // Calculate attendance statistics for the selected teacher
  const { attendancePercentage, presentCount, totalCount } = useMemo(() => {
    if (!selectedTeacher) return { attendancePercentage: 0, presentCount: 0, totalCount: 0 };
    
    const teacherData = attendanceByTeacher[selectedTeacher];
    if (!teacherData || !Array.isArray(teacherData.records)) {
      return { attendancePercentage: 0, presentCount: 0, totalCount: 0 };
    }
    
    const total = teacherData.records.length;
    const present = teacherData.records.filter(record => record.present).length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return {
      attendancePercentage: percentage,
      presentCount: present,
      totalCount: total
    };
  }, [selectedTeacher, attendanceByTeacher]);

  // Get attendance for the selected teacher
  const teacherAttendance = useMemo(() => {
    if (!selectedTeacher) return [];
    const teacherData = attendanceByTeacher[selectedTeacher];
    return teacherData ? teacherData.records : [];
  }, [selectedTeacher, attendanceByTeacher]);

  // Filter attendance based on search term
  const filteredAttendance = useMemo(() => {
    if (!searchTerm.trim()) return teacherAttendance;
    
    const term = searchTerm.toLowerCase();
    return teacherAttendance.filter(session => {
      const teacherName = session.takenByName || '';
      const subjectName = session.subjectName || '';
      const date = session.date ? new Date(session.date).toLocaleDateString() : '';
      
      return (
        teacherName.toLowerCase().includes(term) ||
        subjectName.toLowerCase().includes(term) ||
        date.toLowerCase().includes(term)
      );
    });
  }, [teacherAttendance, searchTerm]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, color: 'error.main' }}>
        <Typography color="error" variant="h6">Error: {error}</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={fetchData}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  const selectedTeacherData = teachers.find(t => t.userid === selectedTeacher) || {};
  const teacherName = selectedTeacherData.fullName || selectedTeacherData.name || selectedTeacher || 'Teacher';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        My Attendance
      </Typography>
      
      <Grid container spacing={3}>
        {/* Teachers List */}
        <Grid item xs={12} md={3}>
          <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: theme.palette.primary.main, color: 'white' }}>
              <Typography variant="subtitle1">Teachers</Typography>
            </Box>
            <List disablePadding>
              {teachers.map((teacher) => (
                <React.Fragment key={teacher.userid}>
                  <ListItem 
                    disablePadding
                    onClick={() => setSelectedTeacher(teacher.userid)}
                    sx={{
                      bgcolor: selectedTeacher === teacher.userid ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                      '&:hover': { bgcolor: 'action.hover', cursor: 'pointer' },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <ListItemButton>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2, width: 32, height: 32 }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <ListItemText 
                        primary={teacher.fullName || teacher.name || teacher.userid} 
                        primaryTypographyProps={{
                          fontWeight: selectedTeacher === teacher.userid ? 'medium' : 'regular'
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Attendance Records */}
        <Grid item xs={12} md={9}>
          <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden', height: '100%' }}>
            {/* Attendance Summary Card */}
            <Box sx={{ 
              p: 2, 
              bgcolor: 'background.paper',
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}>
                <Box>
                  <Typography variant="h6">
                    {teacherName}'s Classes
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {filteredAttendance.length} attendance records found
                  </Typography>
                </Box>
                <TextField
                  size="small"
                  placeholder="Search records..."
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Box>
              
              {/* Attendance Summary */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.primary.main, 0.15) 
                    : alpha(theme.palette.primary.light, 0.1),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  flexWrap: 'wrap'
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {attendancePercentage}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Attendance
                  </Typography>
                </Box>
                <Box sx={{ 
                  height: 50, 
                  width: 1, 
                  maxWidth: 200,
                  position: 'relative',
                  bgcolor: theme.palette.action.disabledBackground,
                  borderRadius: 25,
                  overflow: 'hidden'
                }}>
                  <Box 
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${attendancePercentage}%`,
                      bgcolor: (() => {
                        if (attendancePercentage >= 75) return 'success.main';
                        if (attendancePercentage >= 50) return 'warning.main';
                        return 'error.main';
                      })(),
                      transition: 'width 0.5s ease, background-color 0.5s ease'
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    <Box component="span" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                      {presentCount} present
                    </Box>
                    {' '}•{' '}
                    <Box component="span" sx={{ color: 'error.main', fontWeight: 'medium' }}>
                      {totalCount - presentCount} absent
                    </Box>
                    {' '}• {totalCount} total classes
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {attendancePercentage >= 75 ? 'Good attendance!' : 
                     attendancePercentage >= 50 ? 'Attendance needs improvement' : 
                     'Low attendance - please improve'}
                  </Typography>
                </Box>
              </Paper>
            </Box>
            
            {filteredAttendance.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Typography variant="body1" color="textSecondary">
                  {searchTerm 
                    ? 'No matching attendance records found' 
                    : 'No attendance records available for this teacher'}
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                {filteredAttendance.map((record, index) => (
                  <React.Fragment key={record._id || index}>
                    <ListItem>
                      <ListItemText
                        primary={record.subjectName || 'No Subject'}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {record.date ? new Date(record.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                weekday: 'short'
                              }) : 'No date'}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        {record.present ? (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CheckCircle color="success" sx={{ mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">Present</Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Cancel color="error" sx={{ mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">Absent</Typography>
                          </Box>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredAttendance.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}