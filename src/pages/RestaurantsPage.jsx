import { Alert, Card, CardContent, CardMedia, CircularProgress, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import Button from '../components/ui/Button';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';
import { menuApi } from '../api/contracts';

function RestaurantsPage() {
  const [searchParams] = useSearchParams();
  const location = searchParams.get('location') || 'Seattle';
  const category = searchParams.get('category') || 'All dining';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const result = await menuApi.search({ q: category !== 'All dining' ? category : '', location });
        setItems(Array.isArray(result) ? result : result?.result ?? []);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load dining options.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [category, location]);

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        <Paper sx={{ p: { xs: 3, md: 5 }, border: '1px solid', borderColor: 'divider', mb: 4 }}>
          <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: '0.12em' }}>
            Explore restaurants
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 2 }}>
            {category} in {location}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Public menu and restaurant discovery data is mapped to the backend contract using the GET /menus endpoint and the public response envelope.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="contained">View all restaurants</Button>
            <Button variant="outlined">Refine search</Button>
          </Stack>
        </Paper>

        {error ? (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        ) : null}

        {loading ? (
          <Stack alignItems="center" py={6}>
            <CircularProgress color="primary" />
          </Stack>
        ) : (
          <Grid container spacing={3}>
            {items.map((item) => (
              <Grid key={item.id ?? item.itemName} size={{ xs: 12, md: 6, lg: 4 }}>
                <Card elevation={0} sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
                  <CardMedia component="img" height="220" image={item.itemPicture || item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80'} alt={item.itemName ?? item.name} />
                  <CardContent>
                    <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>
                      {item.categoryName || 'Dining experience'}
                    </Typography>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                      {item.itemName || item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {item.description || 'Fresh seasonal menu crafted for memorable moments together.'}
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      ${Number(item.price ?? 89).toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
      <Footer />
    </>
  );
}

export default RestaurantsPage;
