import React, { useState, useContext } from 'react';
import { api, setAuthToken } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Container, Typography, TextField, Button, Box, Alert, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/users/login', { username, password });
      setAuthToken(res.data.token);
      login({ username, token: res.data.token, role: res.data.role });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card sx={{ width: '100%', boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>Login</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField label="Username" value={username} onChange={e => setUsername(e.target.value)} fullWidth margin="normal" required autoFocus />
            <TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} fullWidth margin="normal" required />
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>Login</Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
