import React from 'react';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function TopBar() {
  const { userid, role, logout } = useAuth();
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>RBAC LMS</Typography>
        <Box sx={{ mr: 2 }}>{userid} ({role})</Box>
        <Button color="inherit" onClick={logout}>Logout</Button>
      </Toolbar>
    </AppBar>
  );
}
