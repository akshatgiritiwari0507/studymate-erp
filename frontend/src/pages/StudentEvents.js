import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, Card, CardContent, Chip, Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import api from '../api/client';

export default function StudentEvents() {
  const [data, setData] = useState({ campusEvents: [], holidays: [] });
  
  const fetchData = async () => {
    try{ 
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const r = await api.get(`/common/events?t=${timestamp}`); 
      console.log('StudentEvents - fetched events:', JSON.stringify(r.data, null, 2));
      
      // Separate events and holidays based on type
      const allEvents = Array.isArray(r.data) ? r.data : [];
      const events = allEvents.filter(e => e.type !== 'holiday');
      const holidays = allEvents.filter(e => e.type === 'holiday');
      
      setData({ 
        campusEvents: events,
        holidays: holidays
      }); 
    } catch(err) {
      console.error('StudentEvents error:', err);
    }
  };
  
  useEffect(()=>{ fetchData(); }, []);
  
  const events = Array.isArray(data.campusEvents) ? data.campusEvents : [];
  const holidays = Array.isArray(data.holidays) ? data.holidays : [];
  
  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', py: 6 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 4, borderRadius: 4, background: 'rgba(255,255,255,0.6)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)', mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d3a4a' }}>Events & Holidays</Typography>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData}>Refresh</Button>
        </Box>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, background: 'rgba(255,255,255,0.7)', boxShadow: '0 4px 16px rgba(31, 38, 135, 0.1)' }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Events</Typography>
              {events.length === 0 ? (
                <Typography color="text.secondary">No events posted.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {events.map((e,i) => (
                    <Card key={i} sx={{ borderRadius: 3, background: 'rgba(255,255,255,0.7)', boxShadow: '0 4px 16px rgba(31, 38, 135, 0.1)', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(31, 38, 135, 0.15)' } }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{e.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{formatDate(e.date)}</Typography>
                        {e.description && <Typography variant="body2" sx={{ mt: 1 }}>{e.description}</Typography>}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, background: 'rgba(255,255,255,0.7)', boxShadow: '0 4px 16px rgba(31, 38, 135, 0.1)' }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Holidays</Typography>
              {holidays.length === 0 ? (
                <Typography color="text.secondary">No holidays posted.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {holidays.map((h,i) => (
                    <Card key={i} sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', boxShadow: '0 4px 16px rgba(31, 38, 135, 0.1)', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(31, 38, 135, 0.15)' } }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{h.title}</Typography>
                          <Chip label="Holiday" size="small" color="secondary" />
                        </Box>
                        <Typography variant="body2" color="text.secondary">{formatDate(h.date)}</Typography>
                        {h.description && <Typography variant="body2" sx={{ mt: 1 }}>{h.description}</Typography>}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
