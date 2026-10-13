import { Box, Card, CardActionArea, CardContent, CardMedia, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { diningCategories } from '../../data/restaurants';

function DiningCategories() {
  const navigate = useNavigate();

  return (
    <Box component="section" sx={{ py: { xs: 6, md: 8 } }}>
      <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.6rem' }, mb: 1.5 }}>
        Explore by Dining Experience
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 640 }}>
        Find the right atmosphere for every kind of occasion, from date nights to family gatherings.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2.5 }}>
        {diningCategories.map((category) => (
          <Card
            key={category.name}
            sx={{
              height: '100%',
              overflow: 'hidden',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
            }}
          >
            <CardActionArea onClick={() => navigate(`/restaurants?category=${encodeURIComponent(category.name)}`)} sx={{ height: '100%' }}>
              <CardMedia component="img" height="210" image={category.image} alt={category.name} sx={{ objectFit: 'cover' }} />
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2.25 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {category.name}
                </Typography>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: category.accent }} />
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

export default DiningCategories;
