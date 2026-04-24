import React, { useState } from 'react';
import { api } from '../services/api';
import { Container, TextField, Button, Typography, Alert, Card, CardContent } from '@mui/material';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/users/register', form);
      setSuccess('Registration successful! You can now log in.');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card sx={{ width: '100%', boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>Register</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField label="Username" name="username" fullWidth margin="normal" value={form.username} onChange={handleChange} required autoFocus />
            <TextField label="Password" name="password" type="password" fullWidth margin="normal" value={form.password} onChange={handleChange} required />
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>Register</Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
