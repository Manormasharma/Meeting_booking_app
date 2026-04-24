import React, { useEffect, useState, useContext } from 'react';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, Switch, TextField, Box, Alert } from '@mui/material';

export default function AdminPanel() {
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/rooms').then(res => setRooms(res.data));
  }, []);

  const handleCreate = async () => {
    setError(''); setSuccess('');
    try {
      await api.post('/rooms', { name, capacity });
      setSuccess('Room created');
      setName(''); setCapacity(1);
      const res = await api.get('/rooms');
      setRooms(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    }
  };

  const handleToggle = async (room) => {
    await api.put(`/rooms/${room._id}`, { enabled: !room.enabled });
    const res = await api.get('/rooms');
    setRooms(res.data);
  };

  const handleDelete = async (room) => {
    await api.delete(`/rooms/${room._id}`);
    const res = await api.get('/rooms');
    setRooms(res.data);
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Admin Panel</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      <Box sx={{ mb: 2 }}>
        <TextField label="Room Name" value={name} onChange={e => setName(e.target.value)} sx={{ mr: 2 }} />
        <TextField label="Capacity" type="number" value={capacity} onChange={e => setCapacity(e.target.value)} sx={{ mr: 2 }} />
        <Button variant="contained" onClick={handleCreate}>Create Room</Button>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Capacity</TableCell>
            <TableCell>Enabled</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rooms.map(room => (
            <TableRow key={room._id}>
              <TableCell>{room.name}</TableCell>
              <TableCell>{room.capacity}</TableCell>
              <TableCell>
                <Switch checked={room.enabled} onChange={() => handleToggle(room)} />
              </TableCell>
              <TableCell>
                <Button color="error" onClick={() => handleDelete(room)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
}
