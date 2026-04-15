import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Avatar, Menu, MenuItem, ListItemIcon } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import PasswordIcon from '@mui/icons-material/Password';
import LogoutIcon from '@mui/icons-material/Logout';

export default function Layout({ title = 'StudyMate Dashboard', right = null, children }) {
  const nav = useNavigate();
  const { role, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const menuOpen = Boolean(anchorEl);

  const goHome = () => {
    if (role === 'admin') nav('/admin');
    else if (role === 'teacher') nav('/teacher');
    else nav('/student');
  };

  const doLogout = () => {
    logout();
    nav('/login');
  };

  const onTitleClick = () => goHome();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(180deg,#f1f5ff,#ffffff)' }}>
      <AppBar position="fixed" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={onTitleClick}>{title}</Typography>
          {right ?? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton color="inherit" edge="end" onClick={goHome} title="Home" sx={{ color: 'inherit' }}>
                <HomeIcon />
              </IconButton>
              <IconButton color="inherit" onClick={(e)=>setAnchorEl(e.currentTarget)} title="Account">
                <Avatar sx={{ width: 28, height: 28 }}>
                  {role === 'admin' ? 'A' : role === 'teacher' ? 'T' : 'S'}
                </Avatar>
              </IconButton>
              <Menu anchorEl={anchorEl} open={menuOpen} onClose={()=>setAnchorEl(null)}>
                <MenuItem onClick={()=>{ setAnchorEl(null); nav(`/${role || 'student'}/about`); }}>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  About
                </MenuItem>
                <MenuItem onClick={()=>{ setAnchorEl(null); nav(`/${role || 'student'}/change-password`); }}>
                  <ListItemIcon><PasswordIcon fontSize="small" /></ListItemIcon>
                  Change Password
                </MenuItem>
                <MenuItem onClick={()=>{ setAnchorEl(null); doLogout(); }}>
                  <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Box sx={{ flex: 1, pt: 8, display: 'flex' }}>
        {children}
      </Box>
    </Box>
  );
}
