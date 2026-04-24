import React, { useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { formatTime, formatTimeRange } from '../utils/dateFormat';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [availability, setAvailability] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quickBookingKey, setQuickBookingKey] = useState('');

  const loadDashboard = () => {
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return Promise.all([
      api.get('/bookings/availability', {
        params: {
          from: new Date().toISOString(),
          to: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
      }),
      api.get('/bookings/public-schedule', {
        params: { from, to },
      }),
    ])
      .then(([availabilityRes, scheduleRes]) => {
        setAvailability(availabilityRes.data);
        setSchedule(scheduleRes.data);
        setError('');
      })
      .catch((err) => {
        setError(err.response?.data?.error || err.message || 'Could not load dashboard data.');
      });
  };

  const loadAvailability = () => api.get('/bookings/availability', {
      params: {
        from: new Date().toISOString(),
        to: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
    })
    .then((res) => setAvailability(res.data))
    .catch((err) => setError(err.response?.data?.error || err.message || 'Could not load dashboard data.'));

  useEffect(() => {
    loadDashboard();
    const interval = window.setInterval(loadDashboard, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const handleQuickBook = async (roomId, durationMinutes) => {
    setError('');
    setSuccess('');
    if (!user) {
      navigate('/login');
      return;
    }

    const actionKey = `${roomId}-${durationMinutes}`;
    setQuickBookingKey(actionKey);
    try {
      const res = await api.post('/bookings/quick', {
        room: roomId,
        people: 1,
        duration_minutes: durationMinutes,
      });
      setSuccess(`Booked ${res.data.room_id?.name || 'room'} for ${durationMinutes} minutes.`);
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Quick booking failed. Please log in and try again.');
    } finally {
      setQuickBookingKey('');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Real-time Availability</Typography>
            <Typography color="text.secondary">Live room status for the current hour. Refreshes automatically.</Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button component={RouterLink} to="/book" variant="outlined">Pick a time</Button>
          </Stack>
        </Stack>
      </Paper>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Grid container spacing={3}>
        {availability.map(({ room, available, current_booking: currentBooking }) => {
          return (
          <Grid item xs={12} sm={6} md={4} key={room._id}>
            <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 1 }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{room.name}</Typography>
                      <Typography variant="body2" color="text.secondary">Capacity: {room.capacity}</Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={!room.enabled ? 'Disabled' : available ? 'Available now' : 'In use'}
                      color={!room.enabled ? 'default' : available ? 'success' : 'warning'}
                    />
                  </Stack>
                  {(room.amenities || []).length > 0 && (
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {room.amenities.map((amenity) => (
                        <Chip key={amenity} size="small" label={amenity} variant="outlined" />
                      ))}
                    </Stack>
                  )}
                  {room.enabled ? (
                    currentBooking ? (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Current booking</Typography>
                        <Typography variant="body2">
                          Until {formatTime(currentBooking.end_time)}
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Quick book</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {[30, 60, 120, 180].map((duration) => {
                            const actionKey = `${room._id}-${duration}`;
                            const label = duration === 30 ? '30 min' : `${duration / 60} hr`;
                            return (
                              <Button
                                key={duration}
                                size="small"
                                variant={duration === 30 ? 'contained' : 'outlined'}
                                disabled={quickBookingKey === actionKey}
                                onClick={() => handleQuickBook(room._id, duration)}
                                sx={{ minWidth: 72 }}
                              >
                                {quickBookingKey === actionKey ? '...' : label}
                              </Button>
                            );
                          })}
                        </Stack>
                      </Box>
                    )
                  ) : (
                    <Typography variant="body2" color="text.secondary">Unavailable for new bookings.</Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        );})}
      </Grid>
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mt: 4, border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Booked Time Slots</Typography>
            <Typography variant="body2" color="text.secondary">Upcoming room bookings for the next 24 hours.</Typography>
          </Box>
          <Button component={RouterLink} to="/book" variant="outlined">Manage my bookings</Button>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Room</TableCell>
              <TableCell>Booked by</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>People</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schedule.map((booking) => (
              <TableRow key={booking._id}>
                <TableCell>{booking.room?.name || 'Room'}</TableCell>
                <TableCell>{booking.booked_by}</TableCell>
                <TableCell>
                  {formatTimeRange(booking.start_time, booking.end_time)}
                </TableCell>
                <TableCell>{booking.duration_minutes} min</TableCell>
                <TableCell>{booking.people}</TableCell>
              </TableRow>
            ))}
            {schedule.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">No rooms are booked in the next 24 hours.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}
