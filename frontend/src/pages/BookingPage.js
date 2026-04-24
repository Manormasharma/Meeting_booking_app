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
  const [aiChat, setAiChat] = useState([]); // [{role: 'user'|'assistant', content: string}]
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
    setError("");
    setSuccess("");
    setLoadingAI(true);
    const userMsg = aiInput.trim();
    if (!userMsg) return;
    setAiChat(prev => [...prev, { role: "user", content: userMsg }]);
    setAiInput("");
    try {
      const res = await api.post("/ai-bookings", { input: userMsg });
      const { parsed, booking, room, message, action } = res.data;
      setAiChat(prev => [...prev, { role: "assistant", content: message }]);
      // Optionally update booking form if parsed
      if (parsed) {
        setPeople(parsed.people || 1);
        setStart(toLocalInputValue(parsed.start_time));
        setEnd(toLocalInputValue(parsed.end_time));
      }
      if (action === "BOOKED") {
        setSuccess(message);
        setRoom(room?._id || "");
        return;
      }
      if (room) {
        setRoom(room._id);
      }
    } catch (err) {
      const msg = err.response?.data?.error || "AI could not process your request.";
      setAiChat(prev => [...prev, { role: "assistant", content: msg }]);
      setError(msg);
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
            <Stack spacing={2} sx={{ height: 400, display: 'flex' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>AI Booking Assistant</Typography>
                <Typography variant="body2" color="text.secondary">
                  Try: Book a room for 5 people tomorrow at 3 PM for 1 hour
                </Typography>
              </Box>
              <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: 'background.default', p: 1, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                {aiChat.length === 0 && (
                  <Typography variant="body2" color="text.secondary">Start a conversation with the assistant.</Typography>
                )}
                {aiChat.map((msg, idx) => (
                  <Box key={idx} sx={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}>
                    <Box sx={{
                      maxWidth: '80%',
                      px: 2, py: 1,
                      borderRadius: 2,
                      bgcolor: msg.role === 'user' ? 'primary.light' : 'grey.100',
                      color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                      boxShadow: 1
                    }}>
                      <Typography variant="body2">{msg.content}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  label="Type your message"
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  fullWidth
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!loadingAI && aiInput.trim()) handleAI();
                    }
                  }}
                  multiline
                  minRows={1}
                  maxRows={4}
                  disabled={loadingAI}
                />
                <Button
                  onClick={handleAI}
                  disabled={!aiInput.trim() || loadingAI}
                  variant="outlined"
                >
                  {loadingAI ? "..." : "Send"}
                </Button>
              </Stack>
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
