import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Card, CardContent, Chip } from '@mui/material';
import api from '../api/client';

export default function TeacherNotice() {
  const [items, setItems] = useState([]);
  useEffect(()=>{ (async()=>{ try{ const r=await api.get('/teacher/me/notices'); setItems(r.data||[]);}catch{}})(); },[]);
  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', py: 6 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 4, borderRadius: 4, background: 'rgba(255,255,255,0.6)', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d3a4a', mb: 4 }}>Notices</Typography>
        {items.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, background: 'rgba(255,255,255,0.7)' }}>
            <Typography color="text.secondary">No notices yet.</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {items.map((n,i) => (
              <Card key={i} sx={{ borderRadius: 3, background: 'rgba(255,255,255,0.7)', boxShadow: '0 4px 16px rgba(31, 38, 135, 0.1)', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(31, 38, 135, 0.15)' } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3a4a' }}>{n.title || 'Notice'}</Typography>
                    <Chip label={n.type || 'General'} size="small" color="primary" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{n.message || n.description || ''}</Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="caption" color="text.secondary">
                      Date: {n.date ? new Date(n.date).toLocaleDateString() : 'Not specified'}
                    </Typography>
                    {n.priority && (
                      <Typography variant="caption" color="text.secondary">
                        Priority: {n.priority}
                      </Typography>
                    )}
                    {n.targetAudience && (
                      <Typography variant="caption" color="text.secondary">
                        Audience: {n.targetAudience}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
