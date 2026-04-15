import React, { useEffect, useState } from 'react';
import { 
  Box, 
  List, 
  ListItemButton, 
  ListItemText, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  Collapse, 
  IconButton, 
  Divider,
  Button,
  ListItemIcon
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { format, parse } from 'date-fns';
import api from '../api/client';

export default function StudentAssignments() {
  const [items, setItems] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [activeTeacher, setActiveTeacher] = useState('');
  const [expanded, setExpanded] = useState({});

  const loadAssignments = async (teacherUserId) => {
    const params = teacherUserId ? { teacherUserId } : {};
    try { 
      const r = await api.get('/student/v2/assignments', { params }); 
      console.log('API Response:', r.data); // Log the API response
      
      // Transform the data to match our expected format
      const transformedItems = (r.data || []).map(item => {
        console.log('Original item:', item); // Debug log
        
        // Try to find a valid date in the item
        let dueDate = null;
        
        // First, try to find a date in the item's properties
        const dateFields = [
          'dueDate', 'due_date', 'duedate',
          'endDate', 'end_date', 'enddate',
          'date', 'assignmentDate', 'submissionDate'
        ];
        
        for (const field of dateFields) {
          if (item[field]) {
            const date = new Date(item[field]);
            if (!isNaN(date.getTime())) {
              dueDate = item[field];
              console.log(`Found date in field ${field}:`, dueDate);
              break;
            }
          }
        }
        
        // If still no date, try to extract from title/description
        if (!dueDate) {
          const text = [
            item.title,
            item.description,
            item.details,
            JSON.stringify(item) // as a last resort, stringify the whole object
          ].join(' ');
          
          // Look for various date formats
          const dateFormats = [
            /(\d{4}-\d{2}-\d{2})/, // YYYY-MM-DD
            /(\d{2}\/\d{2}\/\d{4})/, // DD/MM/YYYY or MM/DD/YYYY
            /(\d{1,2}-\d{1,2}-\d{4})/ // DD-MM-YYYY or MM-DD-YYYY
          ];
          
          for (const format of dateFormats) {
            const match = text.match(format);
            if (match) {
              const date = new Date(match[0]);
              if (!isNaN(date.getTime())) {
                dueDate = match[0];
                console.log('Extracted date from text:', dueDate);
                break;
              }
            }
          }
        }
        
        // If we still don't have a date, use a fallback
        if (!dueDate) {
          // Use current date + 7 days as fallback for testing
          const fallbackDate = new Date();
          fallbackDate.setDate(fallbackDate.getDate() + 7);
          dueDate = fallbackDate.toISOString();
          console.log('Using fallback date:', dueDate);
        }
        
        return {
          _id: item._id || Math.random().toString(36).substr(2, 9),
          title: item.title || 'Untitled Assignment',
          subject: item.subject || 'General',
          description: item.description || item.details || 'No description available.',
          dueDate: dueDate,
          status: item.status || 'pending',
          attachments: item.attachments || []
        };
      });
      
      console.log('Transformed items:', transformedItems); // Debug log
      setItems(transformedItems);
      
      // Initialize expanded state for each assignment
      const expandedState = {};
      transformedItems.forEach(item => {
        expandedState[item._id] = false;
      });
      setExpanded(expandedState);
    } catch (error) { 
      console.error('Error loading assignments:', error);
      setItems([]); 
      setExpanded({});
    }
  };

  const loadTeachers = async () => { 
    try { 
      const r = await api.get('/student/v2/teachers'); 
      const list = r.data || []; 
      setTeachers(list); 
      if (list.length && !activeTeacher) { 
        setActiveTeacher(list[0].userid); 
      } 
    } catch { 
      setTeachers([]);
    } 
  };

  useEffect(() => { 
    (async () => { 
      await loadTeachers(); 
    })(); 
  }, []);
  
  useEffect(() => { 
    if (activeTeacher !== undefined) { 
      loadAssignments(activeTeacher || undefined); 
    } 
    /* eslint-disable-next-line */
  }, [activeTeacher]);

  const handleExpandClick = (id) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatDate = (dateString, formatType = 'long') => {
    console.log('Formatting date:', dateString); // Debug log
    if (!dateString) return 'No due date';
    
    try {
      let date;
      
      // First try direct date parsing
      date = new Date(dateString);
      
      // If that fails, try parsing as timestamp
      if (isNaN(date.getTime()) && !isNaN(dateString)) {
        date = new Date(parseInt(dateString));
      }
      
      // If still not a valid date, try parsing as custom format
      if (isNaN(date.getTime())) {
        const dateStr = String(dateString);
        
        // Try to extract date parts from string
        let year, month, day;
        
        // Try YYYY-MM-DD format
        const ymdMatch = dateStr.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        if (ymdMatch) {
          year = parseInt(ymdMatch[1]);
          month = parseInt(ymdMatch[2]) - 1; // months are 0-based in JS
          day = parseInt(ymdMatch[3]);
          date = new Date(year, month, day);
        } 
        // Try DD-MM-YYYY or DD/MM/YYYY
        else {
          const dmyMatch = dateStr.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
          if (dmyMatch) {
            day = parseInt(dmyMatch[1]);
            month = parseInt(dmyMatch[2]) - 1; // months are 0-based in JS
            year = parseInt(dmyMatch[3]);
            date = new Date(year, month, day);
          }
        }
      }
      
      // If we still don't have a valid date, return a fallback
      if (isNaN(date.getTime())) {
        console.warn('Could not parse date:', dateString);
        return 'No date';
      }
      
      // Format the date based on the requested format
      if (formatType === 'short') {
        // Return in format: Nov 21
        return format(date, 'MMM d');
      } else if (formatType === 'long') {
        // Return in format: November 21, 2023
        return format(date, 'MMMM d, yyyy');
      }
      
      // Default format: MMM d, yyyy (e.g., Nov 21, 2023)
      return format(date, 'MMM d, yyyy');
      
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    try {
      const today = new Date();
      const due = new Date(dueDate);
      const diffTime = due - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };
  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', py: 6 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 4, borderRadius: 4, background: 'rgba(255,255,255,0.6)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d3a4a', mb: 4 }}>Assignments</Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, borderRadius: 3, background: 'rgba(255,255,255,0.7)', boxShadow: '0 4px 16px rgba(31, 38, 135, 0.1)' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Teachers</Typography>
              <List dense>
                {(teachers||[]).map(t => (
                  <ListItemButton key={t.userid} selected={activeTeacher===t.userid} onClick={()=>setActiveTeacher(t.userid)} sx={{ borderRadius: 2, '&.Mui-selected': { backgroundColor: 'rgba(99, 102, 241, 0.1)' } }}>
                    <ListItemText primary={t.name || t.userid} secondary={t.userid} />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={9}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {items.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, background: 'rgba(255,255,255,0.7)' }}>
                  <Typography color="text.secondary">No assignments found.</Typography>
                </Paper>
              ) : (
                items.map(item => {
                  const daysRemaining = getDaysRemaining(item.dueDate);
                  const isOverdue = daysRemaining !== null && daysRemaining < 0;
                  const isDueSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 2;
                  
                  return (
                    <Card 
                      key={item._id} 
                      sx={{ 
                        borderRadius: 3, 
                        background: 'rgba(255,255,255,0.7)', 
                        boxShadow: '0 4px 16px rgba(31, 38, 135, 0.1)', 
                        transition: 'all 0.3s ease',
                        mb: 2,
                        '&:hover': { 
                          boxShadow: '0 8px 24px rgba(31, 38, 135, 0.15)' 
                        } 
                      }}
                    >
                      <CardContent sx={{ p: 0 }}>
                        <Box 
                          sx={{ 
                            p: 2, 
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.02)'
                            }
                          }}
                          onClick={() => handleExpandClick(item._id)}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3a4a', mb: 0.5 }}>
                                {item.title}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <Chip 
                                    label={item.subject || 'Assignment'} 
                                    size="small" 
                                    color="secondary" 
                                    variant="outlined"
                                    sx={{ 
                                      fontWeight: 500,
                                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                      color: '#ef4444',
                                      borderColor: 'rgba(239, 68, 68, 0.3)'
                                    }}
                                  />
                                  {item.dueDate && (
                                    <Chip 
                                      label={`Due: ${formatDate(item.dueDate, 'short')}`}
                                      size="small"
                                      color="error"
                                      variant="outlined"
                                      sx={{ 
                                        fontWeight: 600,
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        borderColor: 'rgba(239, 68, 68, 0.3)'
                                      }}
                                    />
                                  )}
                                </Box>
                                {daysRemaining !== null && (
                                  <Chip 
                                    label={
                                      isOverdue 
                                        ? `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'}`
                                        : isDueSoon 
                                          ? `Due in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
                                          : `Due in ${daysRemaining} days`
                                    }
                                    size="small"
                                    color={
                                      isOverdue ? 'error' : 
                                      isDueSoon ? 'warning' : 
                                      'default'
                                    }
                                    variant="outlined"
                                    sx={{ fontWeight: 500 }}
                                  />
                                )}
                              </Box>
                            </Box>
                            <IconButton
                              size="small"
                              sx={{
                                transform: expanded[item._id] ? 'rotate(180deg)' : 'rotate(0)',
                                transition: 'transform 0.3s',
                                ml: 1
                              }}
                            >
                              <ExpandMoreIcon />
                            </IconButton>
                          </Box>
                        </Box>

                        <Collapse in={expanded[item._id]} timeout="auto" unmountOnExit>
                          <Divider />
                          <Box sx={{ p: 2 }}>
                            {item.description && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                  DESCRIPTION
                                </Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                  {item.description || 'No description provided.'}
                                </Typography>
                              </Box>
                            )}

                            {(item.attachments || []).length > 0 && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                  ATTACHMENTS
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {item.attachments.map((file, idx) => (
                                    <Button
                                      key={idx}
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      size="small"
                                      variant="outlined"
                                      startIcon={<DownloadIcon />}
                                      sx={{ textTransform: 'none' }}
                                    >
                                      {file.name || `Attachment ${idx + 1}`}
                                    </Button>
                                  ))}
                                </Box>
                              </Box>
                            )}

                          </Box>
                        </Collapse>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
