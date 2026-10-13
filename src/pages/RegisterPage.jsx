import { Alert, Box, Container, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';
import { authApi } from '../api/contracts';

const initialValues = {
  username: '',
  fullname: '',
  email: '',
  phone: '',
  password: '',
  passwordAgain: '',
};

function RegisterPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!values.username.trim() || !values.fullname.trim() || !values.password || !values.passwordAgain) {
      setError('Username, full name, and password fields are required.');
      return;
    }

    if (values.password.length < 8 || values.password !== values.passwordAgain) {
      setError('Passwords must match and contain at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authApi.register({
        username: values.username.trim(),
        fullname: values.fullname.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
        passwordAgain: values.passwordAgain,
      });

      setSuccess('Account created successfully. Redirecting to sign in...');
      setTimeout(() => navigate('/login'), 1000);
    } catch (submitError) {
      setError(submitError.message || 'Unable to create account right now.');
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
            Create your account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Join to save preferences, track reservations, and unlock exclusive dining experiences.
          </Typography>

          <Stack spacing={2}>
            <Input label="Username" name="username" value={values.username} onChange={handleChange} />
            <Input label="Full name" name="fullname" value={values.fullname} onChange={handleChange} />
            <Input label="Email" name="email" type="email" value={values.email} onChange={handleChange} />
            <Input label="Phone" name="phone" value={values.phone} onChange={handleChange} />
            <Input label="Password" name="password" type="password" value={values.password} onChange={handleChange} />
            <Input label="Confirm password" name="passwordAgain" type="password" value={values.passwordAgain} onChange={handleChange} />

            {error ? <Alert severity="error">{error}</Alert> : null}
            {success ? <Alert severity="success">{success}</Alert> : null}

            <Button type="submit" variant="contained" fullWidth disabled={loading}>
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </Stack>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#6D28D9', fontWeight: 700 }}>
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
      <Footer />
    </>
  );
}

export default RegisterPage;
