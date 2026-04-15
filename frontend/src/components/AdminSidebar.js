import React from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, Divider } from '@mui/material';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import EventIcon from '@mui/icons-material/Event';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import CampaignIcon from '@mui/icons-material/Campaign';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ClassIcon from '@mui/icons-material/Class';
import PersonIcon from '@mui/icons-material/Person';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AdminSidebar() {
  const nav = useNavigate();
  const loc = useLocation();
  const active = (p)=> loc.pathname === p;
  const go = (p)=>()=> nav(p);

  return (
    <Box sx={{ width: 260, backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', pt: 1 }}>
      <List component="nav">
        <Divider sx={{ my: 1 }} />
        <ListItemButton onClick={go('/admin/role')} selected={active('/admin/role')}>
          <ListItemIcon><ManageAccountsIcon /></ListItemIcon>
          <ListItemText primary="Role" />
        </ListItemButton>
        <ListItemButton onClick={go('/admin/password-reset')} selected={active('/admin/password-reset')}>
          <ListItemIcon><VpnKeyIcon /></ListItemIcon>
          <ListItemText primary="Password Reset" />
        </ListItemButton>
        <ListItemButton onClick={go('/admin/courses-sections')} selected={active('/admin/courses-sections')}>
          <ListItemIcon><LibraryBooksIcon /></ListItemIcon>
          <ListItemText primary="Courses & Sections" />
        </ListItemButton>
        <ListItemButton onClick={go('/admin/teachers')} selected={active('/admin/teachers')}>
          <ListItemIcon><PersonIcon /></ListItemIcon>
          <ListItemText primary="Teachers" />
        </ListItemButton>
        <ListItemButton onClick={go('/admin/teacher-accounts')} selected={active('/admin/teacher-accounts')}>
          <ListItemIcon><PersonIcon /></ListItemIcon>
          <ListItemText primary="Teacher Accounts" />
        </ListItemButton>
        <ListItemButton onClick={go('/admin/events')} selected={active('/admin/events')}>
          <ListItemIcon><EventIcon /></ListItemIcon>
          <ListItemText primary="Events" />
        </ListItemButton>
        <ListItemButton onClick={go('/admin/bus')} selected={active('/admin/bus')}>
          <ListItemIcon><DirectionsBusIcon /></ListItemIcon>
          <ListItemText primary="Campus Bus" />
        </ListItemButton>
        <ListItemButton onClick={go('/admin/notice')} selected={active('/admin/notice')}>
          <ListItemIcon><CampaignIcon /></ListItemIcon>
          <ListItemText primary="Notice" />
        </ListItemButton>
        <ListItemButton onClick={go('/admin/lost-found')} selected={active('/admin/lost-found')}>
          <ListItemIcon><ReportProblemIcon /></ListItemIcon>
          <ListItemText primary="Lost & Found" />
        </ListItemButton>
      </List>
    </Box>
  );
}