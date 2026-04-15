import React from 'react';
import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate, useLocation } from 'react-router-dom';

export default function TeacherSidebar() {
  const nav = useNavigate();
  const loc = useLocation();
  const active = (path) => loc.pathname === path;
  const go = (p)=>()=>nav(p);

  return (
    <Box sx={{ width: 260, backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', pt: 1 }}>
      <List component="nav">
        <Divider sx={{ my: 1 }} />

        <ListItemButton selected={active('/teacher/assign-by-section')} onClick={go('/teacher/assign-by-section')}>
          <ListItemIcon><AssignmentIcon /></ListItemIcon>
          <ListItemText primary={<Typography fontWeight={600}>Assignments</Typography>} />
        </ListItemButton>
        <ListItemButton selected={active('/teacher/attendance-by-section')} onClick={go('/teacher/attendance-by-section')}>
          <ListItemIcon><FactCheckIcon /></ListItemIcon>
          <ListItemText primary={<Typography fontWeight={600}>Attendance</Typography>} />
        </ListItemButton>
        <ListItemButton selected={active('/teacher/lost-found')} onClick={go('/teacher/lost-found')}>
          <ListItemIcon><ReportProblemIcon /></ListItemIcon>
          <ListItemText primary={<Typography fontWeight={600}>Lost & Found</Typography>} />
        </ListItemButton>
        <ListItemButton selected={active('/teacher/notice')} onClick={go('/teacher/notice')}>
          <ListItemIcon><NotificationsIcon /></ListItemIcon>
          <ListItemText primary={<Typography fontWeight={600}>Notices</Typography>} />
        </ListItemButton>
      </List>
    </Box>
  );
}
