import { Button, Card, CardActions, CardContent, CardMedia, Chip, Rating, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function RestaurantCard({ restaurant }) {
  const navigate = useNavigate();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease, box-shadow 0.2s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}>
      <CardMedia
        component="img"
        image={restaurant.image}
        alt={restaurant.name}
        sx={{ height: 220, objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Stack direction="row" sx={{ mb: 1, justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip label={restaurant.badge} color="primary" sx={{ bgcolor: 'primary.light', color: 'primary.main', fontWeight: 700 }} />
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Rating value={restaurant.rating} precision={0.1} readOnly size="small" />
            <Typography variant="body2" color="text.secondary">
              {restaurant.rating}
            </Typography>
          </Stack>
        </Stack>

        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          {restaurant.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {restaurant.cuisine}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {restaurant.location}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {restaurant.priceRange} · {restaurant.reviews} reviews
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
        <Button variant="text" color="primary" onClick={() => navigate(`/restaurants/${restaurant.id}`)}>
          View Restaurant
        </Button>
        <Button variant="contained" onClick={() => navigate('/reservations/new')}>
          Reserve
        </Button>
      </CardActions>
    </Card>
  );
}

export default RestaurantCard;
