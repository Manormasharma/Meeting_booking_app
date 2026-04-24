import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BookingPage from './pages/BookingPage';
import AdminPanel from './pages/AdminPanel';
import LoginPage from './pages/LoginPage';
import { AuthContext, AuthProvider } from './context/AuthContext';
import RegisterPage from './pages/RegisterPage';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#185a9d',
    },
    secondary: {
      main: '#2e7d32',
    },
    background: {
      default: '#f6f8fb',
    },
  },
  shape: {
    borderRadius: 8,
  },
});

function Navigation() {
  const { user, logout } = useContext(AuthContext);

  return (
    <AppBar position="sticky" color="inherit" elevation={1}>
      <Toolbar component={Container} maxWidth="lg" disableGutters sx={{ px: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
          Meeting Rooms
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button component={RouterLink} to="/" color="inherit">Dashboard</Button>
          <Button component={RouterLink} to="/book" color="inherit">Book</Button>
          {user?.role === 'admin' && <Button component={RouterLink} to="/admin" color="inherit">Admin</Button>}
          {user ? (
            <Button onClick={logout} variant="outlined" size="small">Logout</Button>
          ) : (
            <>
              <Button component={RouterLink} to="/login" color="inherit">Login</Button>
              <Button component={RouterLink} to="/register" variant="contained" size="small">Register</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

function RequireAuth({ children, adminOnly = false }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Navigation />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/book" element={<RequireAuth><BookingPage /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth adminOnly><AdminPanel /></RequireAuth>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
