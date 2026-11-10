import { Box, Button, Container, Stack, Typography } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useNavigate } from 'react-router-dom';
import ReservationSearch from './ReservationSearch';

function HeroSection() {
  const navigate = useNavigate();

  return (
    <Box component="section" sx={{ py: { xs: 5, md: 8 }, background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF7ED 100%)' }}>
      <Container maxWidth="xl">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' }, gap: 4, alignItems: 'center' }}>
          <Box>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.14em' }}>
              Smart reservations built for memorable meals
            </Typography>
            <Typography variant="h1" sx={{ fontSize: { xs: '2.8rem', md: '4.5rem' }, mb: 2 }}>
              Find Your Perfect Table. Make Every Meal Special.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '1rem', md: '1.1rem' }, mb: 3, maxWidth: 560 }}>
              Discover exceptional restaurants, explore their menus, and reserve the perfect table in just a few clicks.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
              <Button variant="contained" size="large" onClick={() => navigate('/restaurants')}>
                Find a Table
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate('/restaurants')}>
                Explore Restaurants
              </Button>
            </Stack>
            <ReservationSearch />
          </Box>

          <Box>
            <Box
              sx={{
                position: 'relative',
                borderRadius: 5,
                overflow: 'hidden',
                minHeight: { xs: 420, md: 650 },
                boxShadow: '0 25px 60px rgba(15, 23, 42, 0.12)',
              }}
            >
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80"
                alt="Restaurant dining room"
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  left: 24,
                  bottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  bgcolor: 'rgba(15, 23, 42, 0.72)',
                  backdropFilter: 'blur(12px)',
                  color: '#fff',
                  borderRadius: 3,
                  py: 1.5,
                  px: 2,
                }}
              >
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'success.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  238 tables available tonight
                </Typography>
                <ArrowForwardRoundedIcon fontSize="small" />
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default HeroSection;
