import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

export default function AdminDashboard() {
  return (
    <Box>
      <Paper elevation={1} sx={{ p:3, borderRadius:3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Hello Admin
        </Typography>
        <Typography color="text.secondary">Use the sidebar to manage users and campus info.</Typography>
      </Paper>
    </Box>
  );
}
