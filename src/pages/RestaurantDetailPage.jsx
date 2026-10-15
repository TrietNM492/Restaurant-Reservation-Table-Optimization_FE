import { useParams } from 'react-router-dom';
import { Button, Container, Paper, Stack, Typography } from '@mui/material';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { restaurants } from '../data/restaurants';

function RestaurantDetailPage() {
  const { id } = useParams();
  const restaurant = restaurants.find((item) => item.id === id) || restaurants[0];

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        <Paper
          sx={{
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <img src={restaurant.image} alt={restaurant.name} style={{ width: '100%', height: 360, objectFit: 'cover' }} />
          <Stack spacing={2} sx={{ p: { xs: 3, md: 5 } }}>
            <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: '0.12em' }}>
              {restaurant.cuisine}
            </Typography>
            <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
              {restaurant.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {restaurant.location} · {restaurant.priceRange} · {restaurant.rating} rating
            </Typography>
            <Typography variant="body1">
              {restaurant.description}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button variant="contained">Reserve this restaurant</Button>
              <Button variant="outlined">View menu</Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
      <Footer />
    </>
  );
}

export default RestaurantDetailPage;
