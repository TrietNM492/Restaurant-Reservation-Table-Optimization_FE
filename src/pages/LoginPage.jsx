import { Alert, Box, Container, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';
import { authApi } from '../services/authService.js';

const initialValues = {
  username: '',
  password: '',
};

function LoginPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!values.username.trim() || !values.password.trim()) {
      setError('Username and password are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authApi.login({
        username: values.username.trim(),
        password: values.password,
      });

      navigate('/');
    } catch (submitError) {
      setError(submitError.message || 'Unable to sign in right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="sm" sx={{ py: { xs: 5, md: 8 } }}>
        <Paper
          component="form"
          onSubmit={handleSubmit}
          sx={{ p: { xs: 3, md: 4 }, border: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to manage reservations and saved dining preferences.
          </Typography>

          <Stack spacing={2}>
            <Input
              label="Username"
              name="username"
              value={values.username}
              onChange={handleChange}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
            />

            {error ? (
              <Alert severity="error">{error}</Alert>
            ) : null}

            <Button type="submit" variant="contained" fullWidth disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Stack>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Need an account?{' '}
              <Link to="/register" style={{ color: '#6D28D9', fontWeight: 700 }}>
                Create one
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
      <Footer />
    </>
  );
}

export default LoginPage;