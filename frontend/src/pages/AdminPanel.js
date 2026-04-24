import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

export default function AdminPanel() {
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRooms = async () => {
    const res = await api.get('/rooms');
    setRooms(res.data);
  };

  useEffect(() => {
    loadRooms().catch(() => setError('Could not load rooms'));
  }, []);

  const handleCreate = async () => {
    setError(''); setSuccess('');
    try {
      await api.post('/rooms', { name, capacity: Number(capacity) });
      setSuccess('Room created');
      setName(''); setCapacity(1);
      await loadRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    }
  };

  const handleToggle = async (room) => {
    setError(''); setSuccess('');
    try {
      await api.put(`/rooms/${room._id}`, { enabled: !room.enabled });
      await loadRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update room');
    }
  };

  const handleUpdate = async (room, updates) => {
    setError(''); setSuccess('');
    try {
      await api.put(`/rooms/${room._id}`, updates);
      await loadRooms();
      setSuccess('Room updated');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update room');
    }
  };

  const handleDelete = async (room) => {
    setError(''); setSuccess('');
    try {
      await api.delete(`/rooms/${room._id}`);
      await loadRooms();
      setSuccess('Room deleted');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete room');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>Admin Panel</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField label="Room Name" value={name} onChange={e => setName(e.target.value)} fullWidth />
          <TextField label="Capacity" type="number" value={capacity} onChange={e => setCapacity(e.target.value)} inputProps={{ min: 1 }} sx={{ width: { sm: 180 } }} />
          <Button variant="contained" onClick={handleCreate} disabled={!name.trim()}>Create Room</Button>
        </Stack>
      </Paper>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Enabled</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rooms.map(room => (
              <TableRow key={room._id}>
                <TableCell>
                  <TextField
                    size="small"
                    defaultValue={room.name}
                    onBlur={(e) => e.target.value !== room.name && handleUpdate(room, { name: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    defaultValue={room.capacity}
                    inputProps={{ min: 1 }}
                    onBlur={(e) => Number(e.target.value) !== room.capacity && handleUpdate(room, { capacity: Number(e.target.value) })}
                    sx={{ width: 110 }}
                  />
                </TableCell>
                <TableCell>
                  <Switch checked={room.enabled} onChange={() => handleToggle(room)} />
                </TableCell>
                <TableCell align="right">
                  <Button color="error" onClick={() => handleDelete(room)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rooms.length === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">No rooms yet.</Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
