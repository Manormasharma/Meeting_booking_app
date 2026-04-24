import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

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

  useEffect(() => {
    api.get('/rooms').then(res => setRooms(res.data.filter(r => r.enabled)));
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
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    }
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
              <Button type="submit" variant="contained" sx={{ mt: 2 }}>Confirm booking</Button>
            </Box>
          </Paper>
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
              <Button onClick={handleAI} variant="outlined" disabled={!aiInput.trim() || loadingAI}>
                {loadingAI ? 'Checking rooms...' : 'Suggest best room'}
              </Button>
              {aiMessage && <Alert severity="info">{aiMessage}</Alert>}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
