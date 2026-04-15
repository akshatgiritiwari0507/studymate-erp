import React, { useEffect, useMemo, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
  Avatar, 
  Card, 
  CardContent, 
  CardHeader,
  Grid,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Assignment as AssignmentIcon, 
  Notifications as NotificationsIcon, 
  School as SchoolIcon,
  Event as EventIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import api from '../api/client';

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 28px rgba(0,0,0,0.12)'
  },
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}));

const GradientCard = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  color: theme.palette.common.white,
  borderRadius: '16px',
  padding: theme.spacing(3),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -50,
    right: -50,
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)'
  }
}));

export default function Student() {
  const [notices, setNotices] = useState([]);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch notices
        const noticesRes = await api.get('/student/v2/notices');
        setNotices(noticesRes.data || []);
        
        // Fetch profile
        const profileRes = await api.get('/student/v2/profile');
        setProfile(profileRes.data || {});
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const latestNotice = useMemo(() => {
    if (!notices || !Array.isArray(notices) || notices.length === 0) return null;
    
    // Create a new array to avoid mutating the original
    const sortedNotices = [...notices];
    
    // Sort notices by date in descending order (newest first)
    sortedNotices.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA; // Sort in descending order (newest first)
    });
    
    return sortedNotices[0];
  }, [notices]);

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    // Format as "Nov 21" like in the assignments page
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDaysLeft = (dueDate) => {
    if (!dueDate) return 0;
    const date = new Date(dueDate);
    if (isNaN(date.getTime())) return 0;
    
    const now = new Date();
    // Reset time part to compare just the dates
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const due = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const theme = useTheme();

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* Welcome Section */}
      <GradientCard elevation={0} sx={{ mb: 3 }}>
        <Box position="relative" zIndex={1}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {`Welcome back, ${profile?.fullName?.trim() ? profile.fullName.split(' ')[0] : 'Student'}! 👋`}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: '600px' }}>
            Here's what's happening with your courses today.
          </Typography>
        </Box>
      </GradientCard>


      <Grid container spacing={3}>
        {/* Latest Notice - Expanded to full width */}
        <Grid item xs={12}>
          <StyledCard sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <NotificationsIcon color="primary" />
                  <Typography variant="h6" component="div">Latest Notice</Typography>
                </Box>
              }
              titleTypographyProps={{
                variant: 'subtitle1',
                fontWeight: 600
              }}
            />
            <CardContent sx={{ flexGrow: 1, pt: 0, minHeight: '200px' }}>
              {latestNotice ? (
                <Box>
                  <Typography variant="subtitle2" color="primary" fontWeight={600} gutterBottom>
                    {formatDate(latestNotice.createdAt)} • {latestNotice.category || 'General'}
                  </Typography>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {latestNotice.title || 'Notice'}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{
                      whiteSpace: 'pre-line',
                      lineHeight: 1.6
                    }}
                  >
                    {latestNotice.message || latestNotice.description || 'No content available.'}
                  </Typography>
                </Box>
              ) : (
                <Box 
                  display="flex" 
                  flexDirection="column" 
                  alignItems="center" 
                  justifyContent="center" 
                  minHeight="150px"
                  textAlign="center"
                >
                  <NotificationsIcon 
                    color="action" 
                    sx={{ 
                      fontSize: 48, 
                      mb: 2,
                      opacity: 0.5
                    }} 
                  />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No notices yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Check back later for important updates.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
    </Box>
  );
}
