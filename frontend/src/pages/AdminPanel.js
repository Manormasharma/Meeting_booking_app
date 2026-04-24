import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  Alert,
  Box,
  Button,
  Chip,
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

const AMENITY_OPTIONS = ['TV', 'Whiteboard', 'Projector', 'Video conferencing', 'Speakerphone'];

export default function AdminPanel() {
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [amenities, setAmenities] = useState([]);
  const [customAmenity, setCustomAmenity] = useState('');
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
      await api.post('/rooms', { name, capacity: Number(capacity), amenities });
      setSuccess('Room created');
      setName(''); setCapacity(1); setAmenities([]); setCustomAmenity('');
      await loadRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    }
  };

  const toggleAmenity = (value) => {
    setAmenities((current) => (
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    ));
  };

  const addCustomAmenity = () => {
    const value = customAmenity.trim();
    if (!value || amenities.includes(value)) return;
    setAmenities((current) => [...current, value]);
    setCustomAmenity('');
  };

  const updateRoomAmenity = (room, value) => {
    const current = room.amenities || [];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];

    handleUpdate(room, { amenities: next });
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
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <TextField label="Room Name" value={name} onChange={e => setName(e.target.value)} fullWidth />
            <TextField label="Capacity" type="number" value={capacity} onChange={e => setCapacity(e.target.value)} inputProps={{ min: 1 }} sx={{ width: { sm: 180 } }} />
            <Button variant="contained" onClick={handleCreate} disabled={!name.trim()}>Create Room</Button>
          </Stack>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Room features</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {AMENITY_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  color={amenities.includes(option) ? 'primary' : 'default'}
                  variant={amenities.includes(option) ? 'filled' : 'outlined'}
                  onClick={() => toggleAmenity(option)}
                />
              ))}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
              <TextField
                size="small"
                label="Custom feature"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomAmenity();
                  }
                }}
              />
              <Button type="button" variant="outlined" onClick={addCustomAmenity}>Add feature</Button>
            </Stack>
            {amenities.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                {amenities.map((item) => (
                  <Chip key={item} label={item} onDelete={() => toggleAmenity(item)} />
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Paper>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Features</TableCell>
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
                <TableCell sx={{ minWidth: 320 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {AMENITY_OPTIONS.map((option) => (
                      <Chip
                        key={option}
                        size="small"
                        label={option}
                        color={(room.amenities || []).includes(option) ? 'primary' : 'default'}
                        variant={(room.amenities || []).includes(option) ? 'filled' : 'outlined'}
                        onClick={() => updateRoomAmenity(room, option)}
                      />
                    ))}
                    {(room.amenities || [])
                      .filter((item) => !AMENITY_OPTIONS.includes(item))
                      .map((item) => (
                        <Chip
                          key={item}
                          size="small"
                          label={item}
                          onDelete={() => updateRoomAmenity(room, item)}
                        />
                      ))}
                  </Stack>
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
