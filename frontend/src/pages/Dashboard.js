import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Alert, Box, Button, Card, CardContent, Chip, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/rooms'),
      api.get('/bookings', {
        params: {
          from: new Date().toISOString(),
          to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      }),
    ])
      .then(([roomsRes, bookingsRes]) => {
        setRooms(roomsRes.data);
        setBookings(bookingsRes.data);
      })
      .catch(() => setError('Could not load dashboard data.'));
  }, []);

  const nextBookingFor = (roomId) => bookings.find((booking) => booking.room?._id === roomId);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Room Availability</Typography>
            <Typography color="text.secondary">Enabled rooms, capacities, and upcoming bookings for the next 24 hours.</Typography>
          </Box>
          <Button component={RouterLink} to="/book" variant="contained">Book a room</Button>
        </Stack>
      </Paper>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={3}>
        {rooms.map((room) => {
          const upcoming = nextBookingFor(room._id);
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
                    <Chip size="small" label={room.enabled ? 'Enabled' : 'Disabled'} color={room.enabled ? 'success' : 'default'} />
                  </Stack>
                  {room.enabled ? (
                    upcoming ? (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Next booking</Typography>
                        <Typography variant="body2">
                          {new Date(upcoming.start_time).toLocaleString()} - {new Date(upcoming.end_time).toLocaleTimeString()}
                        </Typography>
                      </Box>
                    ) : (
                      <Chip label="No bookings in next 24h" color="primary" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
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
    </Container>
  );
}
