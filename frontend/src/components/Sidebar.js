import React from 'react';
import { Box, Collapse, Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import MapIcon from '@mui/icons-material/Map';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar({ role = 'student' }) {
  const [openDaily, setOpenDaily] = React.useState(true);
  const [openCampus, setOpenCampus] = React.useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  const go = (path) => () => nav(path);
  const active = (path) => loc.pathname === path;

  const toggleDaily = () => {
    setOpenDaily((v)=>{ const nv = !v; if (nv) setOpenCampus(false); return nv; });
  };
  const toggleCampus = () => {
    setOpenCampus((v)=>{ const nv = !v; if (nv) setOpenDaily(false); return nv; });
  };

  return (
    <Box sx={{ width: 260, backgroundColor: '#fff', borderRight: '1px solid #e5e7eb', pt: 1 }}>
      <List component="nav">
        <ListItemButton onClick={toggleDaily}>
          <ListItemIcon><CalendarMonthIcon /></ListItemIcon>
          <ListItemText primary={<Typography fontWeight={600}>Daily Use</Typography>} />
          {openDaily ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openDaily} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton sx={{ pl: 6 }} selected={active('/student/timetable')} onClick={go('/student/timetable')}>
              <ListItemIcon><CalendarMonthIcon /></ListItemIcon>
              <ListItemText primary="Class Timetable" />
            </ListItemButton>
            <ListItemButton sx={{ pl: 6 }} selected={active('/student/todo')} onClick={go('/student/todo')}>
              <ListItemIcon><CheckBoxIcon /></ListItemIcon>
              <ListItemText primary="To-Do List" />
            </ListItemButton>
            <ListItemButton sx={{ pl: 6 }} selected={active('/student/assignments')} onClick={go('/student/assignments')}>
              <ListItemIcon><AssignmentIcon /></ListItemIcon>
              <ListItemText primary="Assignment" />
            </ListItemButton>
            <ListItemButton sx={{ pl: 6 }} selected={active('/student/attendance')} onClick={go('/student/attendance')}>
              <ListItemIcon><BarChartIcon /></ListItemIcon>
              <ListItemText primary="Attendance" />
            </ListItemButton>
            <ListItemButton sx={{ pl: 6 }} selected={active('/student/lost-found')} onClick={go('/student/lost-found')}>
              <ListItemIcon><ReportProblemIcon /></ListItemIcon>
              <ListItemText primary="Lost & Found" />
            </ListItemButton>
            <ListItemButton sx={{ pl: 6 }} selected={active('/student/notice')} onClick={go('/student/notice')}>
              <ListItemIcon><ReportProblemIcon /></ListItemIcon>
              <ListItemText primary="Notice" />
            </ListItemButton>
          </List>
        </Collapse>

        <Divider sx={{ my: 1 }} />

        <ListItemButton onClick={toggleCampus}>
          <ListItemIcon><MapIcon /></ListItemIcon>
          <ListItemText primary={<Typography fontWeight={600}>Campus Tools</Typography>} />
          {openCampus ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openCampus} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton sx={{ pl: 6 }} selected={active('/student/events')} onClick={go('/student/events')}>
              <ListItemIcon><CalendarMonthIcon /></ListItemIcon>
              <ListItemText primary="Events & Holidays" />
            </ListItemButton>
            <ListItemButton sx={{ pl: 6 }} selected={active('/student/bus-routes')} onClick={go('/student/bus-routes')}>
              <ListItemIcon><DirectionsBusIcon /></ListItemIcon>
              <ListItemText primary="College Bus Routes" />
            </ListItemButton>
          </List>
        </Collapse>

        {/*
        <Divider sx={{ my: 1 }} />
        <ListItemButton>
          <ListItemIcon><bolt /></ListItemIcon>
          <ListItemText primary={<Typography fontWeight={600}>AI Features (feature available in future)</Typography>} />
          {false ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        */}
      </List>
    </Box>
  );
}
