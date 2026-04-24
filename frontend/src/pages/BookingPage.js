import React, { useState, useEffect, useContext } from 'react';
import { api, aiApi } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Container, Typography, TextField, Button, MenuItem, Box, Alert } from '@mui/material';

export default function BookingPage() {
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [people, setPeople] = useState(1);
  const [aiInput, setAiInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/rooms').then(res => setRooms(res.data.filter(r => r.enabled)));
  }, []);

  const handleAI = async () => {
    setError(''); setSuccess('');
    try {
      const res = await aiApi.post('/ai-bookings', { input: aiInput });
      setPeople(res.data.people || 1);
      setStart(res.data.start_time ? res.data.start_time.slice(0,16) : '');
      setEnd(res.data.end_time ? res.data.end_time.slice(0,16) : '');
    } catch {
      setError('AI could not parse your request.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/bookings', { room, start_time: start, end_time: end, people });
      setSuccess('Booking successful!');
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Book a Room</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField select label="Room" value={room} onChange={e => setRoom(e.target.value)} fullWidth margin="normal" required>
          {rooms.map(r => <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>)}
        </TextField>
        <TextField label="Start Time" type="datetime-local" value={start} onChange={e => setStart(e.target.value)} fullWidth margin="normal" required />
        <TextField label="End Time" type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} fullWidth margin="normal" required />
        <TextField label="People" type="number" value={people} onChange={e => setPeople(e.target.value)} fullWidth margin="normal" required />
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>Book</Button>
      </Box>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">AI Booking Assistant</Typography>
        <TextField label="Describe your booking" value={aiInput} onChange={e => setAiInput(e.target.value)} fullWidth margin="normal" />
        <Button onClick={handleAI} variant="outlined">Parse with AI</Button>
      </Box>
    </Container>
  );
}
