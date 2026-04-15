import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  CircularProgress,
  Grid,
  Collapse
} from '@mui/material';
import { 
  DirectionsBus, 
  Person, 
  Phone, 
  Place, 
  AccessTime,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import api from '../api/client';

export default function StudentBusRoutes() {
  const [shifts, setShifts] = useState({
    morning: { routes: [], loading: true },
    evening: { routes: [], loading: true }
  });
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const toggleRoute = (routeId) => {
    setExpandedRoute(expandedRoute === routeId ? null : routeId);
  };

  // Fetch bus routes data from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use the student-accessible endpoint
        const routesResponse = await api.get('/student/v2/bus-routes');
        
        if (!routesResponse.data) {
          throw new Error('No bus routes data available');
        }
        
        console.log('Bus routes data:', routesResponse.data);
        
        if (routesResponse.data && Array.isArray(routesResponse.data)) {
          // Group routes by shift (morning/evening)
          const morningRoutes = routesResponse.data.filter(route => {
            if (!route.shift) return false;
            const shift = route.shift.toLowerCase();
            return [
              'morning', 
              'shift 1', 
              'shift1', 
              'morning shift', 
              '1st shift',
              '1'
            ].includes(shift);
          });
          
          const eveningRoutes = routesResponse.data.filter(route => {
            if (!route.shift) return false;
            const shift = route.shift.toLowerCase();
            return [
              'evening', 
              'shift 2', 
              'shift2', 
              'evening shift', 
              '2nd shift',
              'afternoon',
              'afternoon shift',
              '2',
              '2nd'
            ].includes(shift);
          });
          
          // Sort routes by bus number
          const sortByBusNumber = (a, b) => {
            const numA = parseInt(a.busNumber?.match(/\d+/) || '0');
            const numB = parseInt(b.busNumber?.match(/\d+/) || '0');
            return numA - numB;
          };
          
          setShifts({
            morning: { 
              routes: morningRoutes.sort(sortByBusNumber), 
              loading: false 
            },
            evening: { 
              routes: eveningRoutes.sort(sortByBusNumber), 
              loading: false 
            }
          });
        } else {
          throw new Error('Invalid data format received from server');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bus routes:', error);
        // Set empty arrays for both shifts on error
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load bus routes. Please try again later.';
        
        setShifts({
          morning: { 
            routes: [], 
            loading: false, 
            error: errorMessage
          },
          evening: { 
            routes: [], 
            loading: false, 
            error: errorMessage
          }
        });
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderShiftCard = (shiftName, shiftData) => (
    <Grid item xs={12} md={6}>
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          backgroundColor: shiftName === 'morning' ? '#f0f9ff' : '#fef2f2'
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DirectionsBus 
              sx={{ 
                color: shiftName === 'morning' ? '#0ea5e9' : '#ef4444',
                mr: 1.5,
                fontSize: 28
              }} 
            />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937' }}>
              {shiftName === 'morning' ? 'Shift 1 (Morning)' : 'Shift 2 (Evening)'}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          {shiftData.loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress size={24} />
            </Box>
          ) : shiftData.routes.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={2}>
              No {shiftName} routes available
            </Typography>
          ) : (
            <List disablePadding>
              {shiftData.routes.map((route) => (
                <React.Fragment key={route._id || route.id}>
                  <ListItem 
                    button 
                    onClick={() => toggleRoute(route._id || route.id)}
                    sx={{
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <DirectionsBus color={shiftName === 'morning' ? 'primary' : 'error'} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={route.routeName || 'Unnamed Route'}
                      secondary={`Bus: ${route.busNumber || 'N/A'}`}
                    />
                    {expandedRoute === (route._id || route.id) ? <ExpandLess /> : <ExpandMore />}
                  </ListItem>
                  
                  <Collapse in={expandedRoute === (route._id || route.id)} timeout="auto" unmountOnExit>
                    <Box sx={{ pl: 6, pr: 2, pb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Person color="action" sx={{ mr: 1, fontSize: 18 }} />
                        <Typography variant="body2">
                          <strong>Driver:</strong> {route.driverName || route.driver?.name || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Phone color="action" sx={{ mr: 1, fontSize: 18 }} />
                        <Typography variant="body2">
                          <strong>Contact:</strong> {route.driverContact || route.driver?.contact || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTime color="action" sx={{ mr: 1, fontSize: 18 }} />
                        <Typography variant="body2">
                          <strong>Timing:</strong> {route.timing || 
                            (route.schedule ? 
                              `${route.schedule.morningPickup || 'N/A'} - ${route.schedule.eveningDrop || 'N/A'}` : 
                              'N/A'
                            )}
                        </Typography>
                      </Box>
                      
                      {route.stops && route.stops.length > 0 && (
                        <Box mt={2}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Bus Stops:
                          </Typography>
                          <List dense disablePadding>
                            {route.stops.map((stop, index) => (
                              <ListItem key={index} sx={{ py: 0.5, pl: 2 }}>
                                <ListItemIcon sx={{ minWidth: 30 }}>
                                  <Place color="action" sx={{ fontSize: 16 }} />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={stop.name || `Stop ${index + 1}`}
                                  secondary={stop.time ? `Time: ${stop.time}` : null}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                  
                  <Divider sx={{ my: 1 }} />
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Grid>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#2d3a4a', mb: 4, px: 2 }}>
          Bus Routes
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {renderShiftCard('morning', shifts.morning)}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderShiftCard('evening', shifts.evening)}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
