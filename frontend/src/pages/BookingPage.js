import React, { useState, useEffect } from 'react';
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
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { formatTimeRange } from '../utils/dateFormat';

const toLocalInputValue = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

export default function BookingPage() {
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [people, setPeople] = useState(1);
  const [aiInput, setAiInput] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const loadBookings = () => {
    return api.get('/bookings', {
      params: {
        mine: 'true',
        from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    }).then(res => setBookings(res.data));
  };

  useEffect(() => {
    api.get('/rooms').then(res => setRooms(res.data.filter(r => r.enabled)));
    loadBookings().catch(() => {});
  }, []);

  const handleAI = async () => {
    setError(''); setSuccess('');
    setAiMessage('');
    setLoadingAI(true);
    try {
      const res = await api.post('/ai-bookings', { input: aiInput });
      const { parsed, suggested_room: suggestedRoom, message } = res.data;
      setPeople(parsed.people || 1);
      setStart(toLocalInputValue(parsed.start_time));
      setEnd(toLocalInputValue(parsed.end_time));
      setRoom(suggestedRoom?._id || '');
      setAiMessage(message);
      setAvailableRooms(res.data.available_rooms || []);
    } catch (err) {
      setError(err.response?.data?.error || 'AI could not parse your request.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/bookings', {
        room,
        start_time: new Date(start).toISOString(),
        end_time: new Date(end).toISOString(),
        people: Number(people),
      });
      setSuccess('Booking successful!');
      await loadBookings();
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    }
  };

  const handleCheckAvailability = async () => {
    setError('');
    setCheckingAvailability(true);
    try {
      const res = await api.get('/bookings/check-availability', {
        params: {
          start_time: new Date(start).toISOString(),
          end_time: new Date(end).toISOString(),
          people,
        },
      });
      setAvailableRooms(res.data.available_rooms || []);
      setRoom(res.data.suggested_room?._id || '');
      setSuccess(res.data.suggested_room ? `Suggested ${res.data.suggested_room.name}` : 'No rooms available for that slot.');
    } catch (err) {
      setError(err.response?.data?.error || 'Availability check failed');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleQuickBook = async () => {
    setError(''); setSuccess('');
    try {
      const res = await api.post('/bookings/quick', {
        people: Number(people),
        duration_minutes: 30,
      });
      setSuccess(`Quick booked ${res.data.room_id?.name || 'a room'} for 30 minutes.`);
      await loadBookings();
    } catch (err) {
      setError(err.response?.data?.error || 'Quick booking failed');
    }
  };

  const handleCancel = async (bookingId) => {
    setError(''); setSuccess('');
    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      setSuccess('Booking cancelled.');
      await loadBookings();
    } catch (err) {
      setError(err.response?.data?.error || 'Cancellation failed');
    }
  };

  const handleRelease = async (bookingId) => {
    setError(''); setSuccess('');
    try {
      await api.patch(`/bookings/${bookingId}/release`);
      setSuccess('Room released early.');
      await loadBookings();
    } catch (err) {
      setError(err.response?.data?.error || 'Early release failed');
    }
  };

  const isInProgress = (booking) => {
    const now = Date.now();
    return booking.status === 'active'
      && new Date(booking.start_time).getTime() <= now
      && new Date(booking.end_time).getTime() > now;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>Book a Room</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Booking Details</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            <Box component="form" onSubmit={handleSubmit}>
              <TextField select label="Room" value={room} onChange={e => setRoom(e.target.value)} fullWidth margin="normal" required>
                {rooms.map(r => <MenuItem key={r._id} value={r._id}>{r.name} ({r.capacity})</MenuItem>)}
              </TextField>
              <TextField InputLabelProps={{ shrink: true }} label="Start Time" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} fullWidth margin="normal" required />
              <TextField InputLabelProps={{ shrink: true }} label="End Time" type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} fullWidth margin="normal" required />
              <TextField label="People" type="number" value={people} onChange={e => setPeople(e.target.value)} fullWidth margin="normal" required inputProps={{ min: 1 }} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
                <Button type="submit" variant="contained">Confirm booking</Button>
                <Button type="button" onClick={handleCheckAvailability} variant="outlined" disabled={!start || !end || checkingAvailability}>
                  {checkingAvailability ? 'Checking...' : 'Check availability'}
                </Button>
                <Button type="button" onClick={handleQuickBook} variant="outlined">Quick book 30 min</Button>
              </Stack>
            </Box>
          </Paper>
          {availableRooms.length > 0 && (
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mt: 3, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Available Rooms</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {availableRooms.map((availableRoom) => (
                  <Chip
                    key={availableRoom._id}
                    label={`${availableRoom.name} (${availableRoom.capacity})`}
                    color={availableRoom._id === room ? 'primary' : 'default'}
                    onClick={() => setRoom(availableRoom._id)}
                  />
                ))}
              </Stack>
            </Paper>
          )}
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, border: '1px solid', borderColor: 'divider' }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>AI Booking Assistant</Typography>
                <Typography variant="body2" color="text.secondary">
                  Try: Book a room for 5 people tomorrow at 3 PM for 1 hour
                </Typography>
              </Box>
              <TextField
                label="Describe your booking"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                fullWidth
                multiline
                minRows={4}
              />
              <Button type="button" onClick={handleAI} variant="outlined" disabled={!aiInput.trim() || loadingAI}>
                {loadingAI ? 'Checking rooms...' : 'Suggest best room'}
              </Button>
              {aiMessage && <Alert severity="info">{aiMessage}</Alert>}
            </Stack>
          </Paper>
          <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mt: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>My Reservations</Typography>
            <Stack spacing={1.5}>
              {bookings.length === 0 && (
                <Typography variant="body2" color="text.secondary">No reservations yet.</Typography>
              )}
              {bookings.map((booking) => (
                <Card key={booking._id} variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {booking.room_id?.name || 'Room'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatTimeRange(booking.start_time, booking.end_time)}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={booking.status || 'active'}
                          color={booking.status === 'active' ? 'success' : 'default'}
                        />
                      </Stack>
                      {booking.google_calendar_html_link && (
                        <Link href={booking.google_calendar_html_link} target="_blank" rel="noreferrer" underline="hover">
                          View in Google Calendar
                        </Link>
                      )}
                      {booking.status === 'active' && (
                        <Stack direction="row" spacing={1}>
                          <Button type="button" size="small" color="error" variant="outlined" onClick={() => handleCancel(booking._id)}>
                            Cancel
                          </Button>
                          <Button type="button" size="small" variant="outlined" disabled={!isInProgress(booking)} onClick={() => handleRelease(booking._id)}>
                            Release now
                          </Button>
                        </Stack>
                      )}
                      {booking.status === 'active' && !isInProgress(booking) && (
                        <Typography variant="caption" color="text.secondary">
                          Release now is available only while the booking is in progress.
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
