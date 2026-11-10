import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function FinalCTA() {
  const navigate = useNavigate();

  return (
    <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
      <Container maxWidth="xl">
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FDE68A 100%)',
            border: '1px solid rgba(249, 115, 22, 0.12)',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 3,
          }}
        >
          <Box>
            <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 1.5 }}>
              Your Next Favorite Restaurant Is Waiting.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620 }}>
              Discover great food, find the right table, and make your next meal memorable.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="outlined" onClick={() => navigate('/restaurants')}>
              Explore Restaurants
            </Button>
            <Button variant="contained" onClick={() => navigate('/reservations/new')}>
              Reserve a Table
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

export default FinalCTA;
