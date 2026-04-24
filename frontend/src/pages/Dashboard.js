import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Container, Typography, Grid, Card, CardContent, Chip } from '@mui/material';

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    api.get('/rooms').then(res => setRooms(res.data));
  }, []);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Meeting Rooms</Typography>
      <Grid container spacing={2}>
        {rooms.map(room => (
          <Grid item xs={12} sm={6} md={4} key={room._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{room.name}</Typography>
                <Typography>Capacity: {room.capacity}</Typography>
                <Chip label={room.enabled ? 'Enabled' : 'Disabled'} color={room.enabled ? 'success' : 'error'} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
